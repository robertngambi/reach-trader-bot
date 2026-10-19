/**
 * Deriv Real-World Broker Integration Service
 * Connects Reach Trader to the official Deriv Broker API:
 * 1. Supports the new Deriv Developer PAT Architecture (Personal Access Tokens & Alphanumeric App IDs)
 *    via REST session setup (https://api.derivws.com/trading/v1) and authenticated WebSocket OTP streams.
 * 2. Supports legacy Deriv WebSocket v3 (wss://ws.derivws.com/websockets/v3) as seamless fallback.
 */

export const PRECONFIGURED_API_TOKEN = 'pat_6aa3bd64e89333de47c66b6426b8eb38dc7e1aeda89a6d9baf50615ff65235f9';
export const PRECONFIGURED_APP_ID = '34GgfKyXUVchTDNkvz8iH';
export const DERIV_FALLBACK_NUMERIC_APP_ID = '1089';

export interface DerivAccountInfo {
  accountId: string;
  rawAccountId?: string;
  balance: number;
  currency: string;
  accountType: 'demo' | 'real';
}

export interface DerivConfig {
  appId: string;
  apiToken: string;
  useSecureWs: boolean;
  endpoint?: string;
  accountType?: 'demo' | 'real';
}

export interface DerivTick {
  symbol: string;
  quote: number;
  epoch: number;
}

export interface DerivProposalOpenContract {
  contract_id: number;
  barrier: string;
  buy_price: number;
  currency: string;
  date_start: number;
  is_sold: number;
  profit: number;
  status: 'open' | 'won' | 'lost';
}

type TickCallback = (tick: DerivTick) => void;
type StatusCallback = (status: 'disconnected' | 'connecting' | 'connected' | 'authorized' | 'error', details?: string) => void;
export type BalanceCallback = (balance: number, currency: string, loginId: string) => void;

class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private config: DerivConfig;

  private tickSubscribers: Map<string, Set<TickCallback>> = new Map();
  private statusSubscribers: Set<StatusCallback> = new Set();
  private balanceSubscribers: Set<BalanceCallback> = new Set();

  private isAuthorized: boolean = false;
  private authorizedAccount: string | null = null;
  private lastBalance: number | null = null;
  private lastCurrency: string = 'USD';
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private hasAttemptedFallbackAppId: boolean = false;
  private pendingProposals: Map<number, { resolve: (res: any) => void; reject: (err: any) => void; stakeUSD: number }> = new Map();

  // Stored PAT accounts (both Demo and Real retrieved directly from Deriv)
  public patAccounts: {
    demo?: DerivAccountInfo;
    real?: DerivAccountInfo;
  } = {};

  // Map internal market IDs to Deriv broker symbols
  public readonly symbolMap: Record<string, string> = {
    'vol-10': 'R_10',
    'vol-25': 'R_25',
    'vol-50': 'R_50',
    'vol-75': 'R_75',
    'vol-100': 'R_100',
    'vol-10-1s': '1HZ10V',
    'vol-25-1s': '1HZ25V',
    'vol-50-1s': '1HZ50V',
    'vol-75-1s': '1HZ75V',
    'vol-100-1s': '1HZ100V',
    'crash-300': 'CRASH300',
    'crash-500': 'CRASH500',
    'crash-1000': 'CRASH1000',
    'boom-300': 'BOOM300',
    'boom-500': 'BOOM500',
    'boom-1000': 'BOOM1000',
    'step-index': 'stpRNG',
    'jump-10': 'JD10',
    'jump-75': 'JD75',
    'jump-100': 'JD100',
    'btc-usd': 'cryBTCUSD',
    'eth-usd': 'cryETHUSD',
    'forex-eurusd': 'frxEURUSD',
    'forex-gbpusd': 'frxGBPUSD',
    'gold-xauusd': 'frxXAUUSD',
  };

  public readonly reverseSymbolMap: Record<string, string> = {
    'R_10': 'vol-10',
    'R_25': 'vol-25',
    'R_50': 'vol-50',
    'R_75': 'vol-75',
    'R_100': 'vol-100',
    '1HZ10V': 'vol-10-1s',
    '1HZ25V': 'vol-25-1s',
    '1HZ50V': 'vol-50-1s',
    '1HZ75V': 'vol-75-1s',
    '1HZ100V': 'vol-100-1s',
    'CRASH300': 'crash-300',
    'CRASH500': 'crash-500',
    'CRASH1000': 'crash-1000',
    'BOOM300': 'boom-300',
    'BOOM500': 'boom-500',
    'BOOM1000': 'boom-1000',
    'stpRNG': 'step-index',
    'JD10': 'jump-10',
    'JD75': 'jump-75',
    'JD100': 'jump-100',
    'cryBTCUSD': 'btc-usd',
    'cryETHUSD': 'eth-usd',
    'frxEURUSD': 'forex-eurusd',
    'frxGBPUSD': 'forex-gbpusd',
    'frxXAUUSD': 'gold-xauusd',
  };

  constructor() {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isLogged = localStorage.getItem('rt_user_logged_in') === 'true';
    const authTimeStr = localStorage.getItem('rt_auth_timestamp');
    const authTime = authTimeStr ? parseInt(authTimeStr, 10) : 0;
    const isSessionValid = isLogged && authTime > 0 && (Date.now() - authTime) < SEVEN_DAYS_MS;

    const savedToken = localStorage.getItem('rt_deriv_api_token');
    const savedAppId = localStorage.getItem('rt_deriv_app_id');
    const savedProtocol = localStorage.getItem('rt_deriv_secure_ws');

    // For new users / fresh deployment: if no valid 7-day session, remove previously connected token and wait for new user!
    let activeToken = '';
    if (isSessionValid && savedToken && savedToken.trim().length > 0) {
      activeToken = savedToken.trim();
    } else if (!isSessionValid) {
      // Clear token so app waits for new user to log in or sign up
      localStorage.removeItem('rt_deriv_api_token');
      localStorage.removeItem('rt_user_logged_in');
      localStorage.removeItem('rt_auth_timestamp');
    }

    const activeAppId = (savedAppId && savedAppId.trim().length > 0) ? savedAppId : PRECONFIGURED_APP_ID;
    if (!savedAppId) localStorage.setItem('rt_deriv_app_id', PRECONFIGURED_APP_ID);

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const useSecureWs = isHttps || savedProtocol !== 'false';

    this.config = {
      appId: activeAppId,
      apiToken: activeToken,
      useSecureWs,
      endpoint: useSecureWs ? 'wss://ws.derivws.com/websockets/v3' : 'ws://ws.derivws.com/websockets/v3',
      accountType: (localStorage.getItem('at_account_type') as 'demo' | 'real') || 'demo',
    };

    // Only connect if the user has a valid authenticated session
    if (isSessionValid && this.config.apiToken && this.config.apiToken.trim().length > 0) {
      setTimeout(() => this.connect(), 400);
    }
  }

  public clearUserSession() {
    this.config.apiToken = '';
    localStorage.removeItem('rt_deriv_api_token');
    localStorage.removeItem('rt_user_logged_in');
    localStorage.removeItem('rt_auth_timestamp');
    localStorage.removeItem('rt_user_login_id');
    this.patAccounts = {};
    this.authorizedAccount = null;
    this.isAuthorized = false;
    this.disconnect();
  }

  public getConfig(): DerivConfig {
    return { ...this.config };
  }

  public setCredentials(appId: string, apiToken: string, useSecureWs: boolean = true) {
    this.config.appId = (appId && appId.trim().length > 0) ? appId.trim() : PRECONFIGURED_APP_ID;
    this.config.apiToken = (apiToken && apiToken.trim().length > 0) ? apiToken.trim() : PRECONFIGURED_API_TOKEN;
    this.config.useSecureWs = useSecureWs;
    this.config.endpoint = useSecureWs ? 'wss://ws.derivws.com/websockets/v3' : 'ws://ws.derivws.com/websockets/v3';

    localStorage.setItem('rt_deriv_app_id', this.config.appId);
    localStorage.setItem('rt_deriv_api_token', this.config.apiToken);
    localStorage.setItem('rt_deriv_secure_ws', useSecureWs ? 'true' : 'false');
    
    this.hasAttemptedFallbackAppId = false;

    this.disconnect();
    if (this.config.apiToken) {
      this.connect();
    }
  }

  public setAccountType(type: 'demo' | 'real') {
    this.config.accountType = type;
    const target = type === 'real' ? this.patAccounts.real : this.patAccounts.demo;
    if (target) {
      this.authorizedAccount = target.accountId;
      this.lastBalance = target.balance;
      this.lastCurrency = target.currency;
      this.notifyBalance(target.balance, target.currency, target.accountId);
      this.notifyStatus('authorized', `Connected to ${target.accountId} (${target.currency} ${target.balance.toFixed(2)})`);

      // If we are on PAT WebSocket, switch to this account's session
      if (this.config.apiToken.startsWith('pat_')) {
        this.connectPatSession(target.accountId);
      }
    }
  }

  public toggleProtocol(useSecureWs: boolean) {
    this.config.useSecureWs = useSecureWs;
    this.config.endpoint = useSecureWs ? 'wss://ws.derivws.com/websockets/v3' : 'ws://ws.derivws.com/websockets/v3';
    localStorage.setItem('rt_deriv_secure_ws', useSecureWs ? 'true' : 'false');
    this.disconnect();
    this.connect();
  }

  public onStatusChange(callback: StatusCallback) {
    this.statusSubscribers.add(callback);
    return () => this.statusSubscribers.delete(callback);
  }

  public onBalanceChange(callback: BalanceCallback) {
    this.balanceSubscribers.add(callback);
    if (this.lastBalance !== null && this.authorizedAccount) {
      callback(this.lastBalance, this.lastCurrency, this.authorizedAccount);
    }
    return () => this.balanceSubscribers.delete(callback);
  }

  private notifyStatus(status: 'disconnected' | 'connecting' | 'connected' | 'authorized' | 'error', details?: string) {
    this.statusSubscribers.forEach(cb => cb(status, details));
  }

  private notifyBalance(balance: number, currency: string, loginId: string) {
    this.balanceSubscribers.forEach(cb => cb(balance, currency, loginId));
  }

  public async fetchBalance() {
    // If PAT Token is used, fetch real-time fresh balance from Deriv Options REST API
    if (this.config.apiToken && this.config.apiToken.startsWith('pat_')) {
      try {
        const res = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken.trim()}`,
            'Deriv-App-ID': this.config.appId.trim(),
          },
        });
        if (res.ok) {
          const json = await res.json();
          this.processPatAccounts(json.data);
          return;
        }
      } catch (e) {
        console.warn('[DerivService] Balance refresh notice:', e);
      }
    }

    // Otherwise query legacy websocket
    if (this.isAuthorized && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ balance: 1 });
    }
  }

  /**
   * Main Connect Method: Automatically handles Deriv PAT Application architecture or v3 WebSocket
   */
  public async connect(fallbackNumericAppId: boolean = false) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.config.apiToken ? this.config.apiToken.trim() : '';
    const appId = this.config.appId ? this.config.appId.trim() : '';

    if (!token) {
      this.notifyStatus('disconnected', 'No Deriv API token configured.');
      return;
    }

    // 1. Detect if this is a modern Deriv Personal Access Token (PAT)
    const isPat = token.startsWith('pat_') || (!/^\d+$/.test(appId) && appId.length > 5);

    if (isPat) {
      await this.connectWithPat(token, appId);
      return;
    }

    // 2. Fallback to Legacy WebSocket v3 (for classic integer app_id + standard token)
    this.connectLegacyV3(fallbackNumericAppId);
  }

  /**
   * Connect using the modern Deriv Developer PAT Architecture (REST + OTP WebSocket)
   */
  private async connectWithPat(token: string, appId: string) {
    this.notifyStatus('connecting', 'Authenticating with Deriv Developer PAT gateway...');

    try {
      // Step A: Fetch accounts from Deriv REST
      const res = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Deriv-App-ID': appId,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[DerivService] PAT auth error:', res.status, errorText);
        this.notifyStatus('error', `Deriv Auth Error (${res.status}): Verify App ID and PAT Token permissions.`);
        return;
      }

      const json = await res.json();
      const accountsList = json?.data;
      if (!Array.isArray(accountsList) || accountsList.length === 0) {
        this.notifyStatus('error', 'No active Deriv accounts found for this PAT.');
        return;
      }

      // Step B: Process and store all accounts (both demo and real)
      this.processPatAccounts(accountsList);

      // Step C: Determine which account to connect to
      const targetType = this.config.accountType || 'demo';
      const activeAcct = (targetType === 'real' ? this.patAccounts.real : this.patAccounts.demo) || this.patAccounts.demo || this.patAccounts.real;

      if (!activeAcct) {
        this.notifyStatus('error', 'Could not locate suitable Deriv trading account.');
        return;
      }

      // Step D: Connect to the authenticated OTP WebSocket session
      await this.connectPatSession(activeAcct.accountId);

    } catch (err: any) {
      console.warn('[DerivService] PAT gateway initialization notice:', err?.message || err);
      this.notifyStatus('error', err?.message || 'Connection failed. Check network connectivity.');
    }
  }

  /**
   * Request OTP from Deriv and establish live streaming WebSocket session
   */
  private async connectPatSession(accountId: string) {
    try {
      this.stopKeepAlive();
      if (this.ws) {
        try { this.ws.close(); } catch {}
        this.ws = null;
      }

      this.notifyStatus('connecting', `Opening live session for ${accountId}...`);

      const cleanId = (accountId || '').replace(/^ACC:\s*/, '').trim();
      const targetApiId = (cleanId === 'ROT925664927' || cleanId === 'ROT9256649227' || !cleanId) ? 'ROT92564927' : cleanId;
      const otpRes = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${encodeURIComponent(targetApiId)}/otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken.trim()}`,
          'Deriv-App-ID': this.config.appId.trim(),
        },
      });

      if (!otpRes.ok) {
        const txt = await otpRes.text();
        console.warn('[DerivService] OTP error:', otpRes.status, txt);
        this.notifyStatus('error', `Failed to obtain WebSocket session OTP (${otpRes.status})`);
        return;
      }

      const otpJson = await otpRes.json();
      const wsUrl = otpJson?.data?.url;

      if (!wsUrl) {
        this.notifyStatus('error', 'Deriv did not provide a WebSocket session URL.');
        return;
      }

      // Connect to the provided WebSocket session URL
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isAuthorized = true;
        this.authorizedAccount = accountId;
        const bal = this.lastBalance !== null ? this.lastBalance : 0;
        this.notifyStatus('authorized', `Connected to Deriv: ${accountId} (${this.lastCurrency} ${bal.toFixed(2)})`);
        this.startKeepAlive();

        // Resubscribe to needed tick streams
        this.tickSubscribers.forEach((_, symbol) => {
          this.send({ ticks: symbol, subscribe: 1 });
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.warn('[DerivWS] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (err: any) => {
        console.warn('[DerivWS] WebSocket notice:', err?.type || 'network_notice');
      };

      this.ws.onclose = () => {
        this.stopKeepAlive();
        this.notifyStatus('disconnected', 'WebSocket session closed. Reconnecting...');
        // Auto-reconnect after 3s
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          if (this.config.apiToken) this.connect();
        }, 3000);
      };

    } catch (e: any) {
      console.warn('[DerivService] Session error:', e);
      this.notifyStatus('error', e?.message || 'Failed to establish WebSocket stream.');
    }
  }

  /**
   * Helper to parse and broadcast PAT accounts
   */
  private processPatAccounts(accountsList: any[]) {
    accountsList.forEach((acc: any) => {
      const type: 'demo' | 'real' = acc.account_type === 'demo' ? 'demo' : 'real';
      const bal = parseFloat(acc.balance || '0');
      const cur = acc.currency || 'USD';
      const rawId = acc.account_id;
      const displayId = type === 'real' ? 'ROT9256649227' : rawId;

      const acctObj: DerivAccountInfo = {
        accountId: displayId,
        rawAccountId: rawId,
        balance: bal,
        currency: cur,
        accountType: type,
      };

      if (type === 'demo') {
        this.patAccounts.demo = acctObj;
      } else {
        this.patAccounts.real = acctObj;
      }

      // Notify balance subscribers for this account
      this.notifyBalance(bal, cur, displayId);
    });

    const active = this.config.accountType === 'real' ? this.patAccounts.real : this.patAccounts.demo;
    if (active) {
      this.isAuthorized = true;
      this.authorizedAccount = active.accountId;
      this.lastBalance = active.balance;
      this.lastCurrency = active.currency;
    }
  }

  /**
   * Connect to Legacy Deriv WebSocket v3
   */
  private connectLegacyV3(fallbackNumericAppId: boolean = false) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const effectiveEndpoint = isHttps
      ? 'wss://ws.derivws.com/websockets/v3'
      : (this.config.useSecureWs ? 'wss://ws.derivws.com/websockets/v3' : 'ws://ws.derivws.com/websockets/v3');

    const isNumeric = /^\d+$/.test(this.config.appId ? this.config.appId.trim() : '');
    const gatewayAppId = (fallbackNumericAppId || !isNumeric) 
      ? DERIV_FALLBACK_NUMERIC_APP_ID 
      : this.config.appId.trim();

    const endpointUrl = `${effectiveEndpoint}?app_id=${encodeURIComponent(gatewayAppId)}&l=EN`;
    
    this.notifyStatus('connecting', `Connecting to Deriv (Gateway ${gatewayAppId})...`);

    try {
      this.ws = new WebSocket(endpointUrl);

      this.ws.onopen = () => {
        this.notifyStatus('connected', 'Gateway connected. Authorizing session...');
        this.startKeepAlive();
        if (this.config.apiToken) {
          this.authorize(this.config.apiToken);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.warn('[DerivWS] Failed to parse message payload:', e);
        }
      };

      this.ws.onerror = (err: any) => {
        console.warn('[DerivWS] Connection status notice:', err?.type || 'network_notice');
        this.notifyStatus('error', 'WebSocket gateway connecting or offline');
      };

      this.ws.onclose = (event) => {
        this.isAuthorized = false;
        this.stopKeepAlive();

        if (!this.hasAttemptedFallbackAppId && !fallbackNumericAppId && this.config.appId !== DERIV_FALLBACK_NUMERIC_APP_ID) {
          this.hasAttemptedFallbackAppId = true;
          this.notifyStatus('connecting', `Retrying with public gateway ID ${DERIV_FALLBACK_NUMERIC_APP_ID}...`);
          setTimeout(() => {
            this.connect(true);
          }, 1000);
          return;
        }

        this.notifyStatus('disconnected', `Disconnected from Deriv (${event.reason || 'code ' + event.code})`);
      };
    } catch (err: any) {
      console.warn('[DerivWS] WebSocket initialization notice:', err?.message || err);
      this.notifyStatus('error', err?.message || 'Failed to initialize WebSocket');
    }
  }

  public disconnect() {
    this.stopKeepAlive();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isAuthorized = false;
    this.notifyStatus('disconnected', 'Disconnected');
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ ping: 1 });
      }
    }, 25000);
  }

  private stopKeepAlive() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public authorize(token: string) {
    return this.send({ authorize: token });
  }

  private handleIncomingMessage(msg: any) {
    // 1. Authorization Response (Legacy v3)
    if (msg.msg_type === 'authorize') {
      if (msg.error) {
        this.isAuthorized = false;
        const errMsg = msg.error.message || 'Authorization failed';
        this.notifyStatus('error', errMsg);
        console.warn('[DerivWS] Auth error:', errMsg);
      } else {
        this.isAuthorized = true;
        this.authorizedAccount = msg.authorize.loginid;
        const bal = msg.authorize.balance !== undefined ? Number(msg.authorize.balance) : 0;
        const cur = msg.authorize.currency || 'USD';
        this.lastBalance = bal;
        this.lastCurrency = cur;
        
        this.notifyStatus('authorized', `Connected as ${msg.authorize.loginid} (${cur} ${bal.toFixed(2)})`);
        this.notifyBalance(bal, cur, msg.authorize.loginid);
        
        this.send({ balance: 1, subscribe: 1 });

        this.tickSubscribers.forEach((_, symbol) => {
          this.send({ ticks: symbol, subscribe: 1 });
        });
      }
      return;
    }

    // 2. Real-time Broker Balance Stream
    if ((msg.msg_type === 'balance' || msg.balance) && msg.balance) {
      const bal = Number(msg.balance.balance);
      const cur = msg.balance.currency || this.lastCurrency || 'USD';
      const loginId = msg.balance.loginid || this.authorizedAccount || '';
      this.lastBalance = bal;
      this.lastCurrency = cur;
      this.notifyBalance(bal, cur, loginId);
      return;
    }

    // 3. Ticks Stream
    if (msg.msg_type === 'tick' && msg.tick) {
      const derivSymbol = msg.tick.symbol;
      const tickData: DerivTick = {
        symbol: derivSymbol,
        quote: Number(msg.tick.quote),
        epoch: Number(msg.tick.epoch),
      };

      const callbacks = this.tickSubscribers.get(derivSymbol);
      if (callbacks) {
        callbacks.forEach(cb => cb(tickData));
      }
      return;
    }

    // 4. Proposal Response (PAT Options API)
    if (msg.msg_type === 'proposal') {
      const reqId = msg.echo_req?.req_id;
      if (msg.error) {
        console.warn('[DerivWS] Proposal error:', msg.error);
        if (reqId && this.pendingProposals.has(reqId)) {
          const p = this.pendingProposals.get(reqId);
          this.pendingProposals.delete(reqId);
          p?.reject(new Error(msg.error.message || 'Proposal failed'));
        }
      } else if (msg.proposal?.id) {
        // Automatically execute the buy with the received proposal ID
        this.send({
          buy: msg.proposal.id,
          price: msg.proposal.ask_price || msg.echo_req?.amount || 1,
          req_id: reqId,
        });
      }
      return;
    }

    // 5. Trade Purchase / Execution response
    if (msg.msg_type === 'buy') {
      const reqId = msg.echo_req?.req_id;
      if (msg.error) {
        console.warn('[DerivWS] Buy contract notice:', msg.error);
        if (reqId && this.pendingProposals.has(reqId)) {
          const p = this.pendingProposals.get(reqId);
          this.pendingProposals.delete(reqId);
          p?.reject(new Error(msg.error.message || 'Contract purchase failed'));
        }
      } else {
        console.log('[DerivWS] Buy contract executed on Deriv:', msg.buy);
        if (msg.buy?.balance_after !== undefined) {
          const newBal = Number(msg.buy.balance_after);
          this.lastBalance = newBal;
          if (this.authorizedAccount) {
            this.notifyBalance(newBal, this.lastCurrency, this.authorizedAccount);
          }
        }
        if (reqId && this.pendingProposals.has(reqId)) {
          const p = this.pendingProposals.get(reqId);
          this.pendingProposals.delete(reqId);
          p?.resolve(msg.buy);
        }
        // Subscribe to live settlement of this contract on Deriv
        if (msg.buy?.contract_id) {
          this.send({
            proposal_open_contract: 1,
            contract_id: msg.buy.contract_id,
            subscribe: 1,
          });
        }
        setTimeout(() => this.fetchBalance(), 3000);
      }
      return;
    }

    // 6. Contract Settlement & Profit Sync
    if (msg.msg_type === 'proposal_open_contract') {
      if (msg.proposal_open_contract?.is_sold === 1) {
        console.log('[DerivWS] Contract settled on Deriv broker, synchronizing ledger balance...');
        this.fetchBalance();
      }
      return;
    }

    // 7. Input validation or general error
    if (msg.error) {
      console.warn('[DerivWS] Gateway error message:', msg.error);
      if (msg.error.code === 'InvalidAppId' || (msg.error.message && msg.error.message.includes('app_id'))) {
        if (!this.hasAttemptedFallbackAppId) {
          this.hasAttemptedFallbackAppId = true;
          this.notifyStatus('connecting', `App ID error. Retrying with public gateway ID ${DERIV_FALLBACK_NUMERIC_APP_ID}...`);
          this.disconnect();
          setTimeout(() => this.connect(true), 1000);
        }
      }
    }
  }

  /**
   * Subscribe to live tick feeds for a specific symbol
   */
  public subscribeTicks(localMarketId: string, callback: TickCallback): () => void {
    const derivSymbol = this.symbolMap[localMarketId] || 'R_75';

    if (!this.tickSubscribers.has(derivSymbol)) {
      this.tickSubscribers.set(derivSymbol, new Set());
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ ticks: derivSymbol, subscribe: 1 });
      }
    }

    this.tickSubscribers.get(derivSymbol)!.add(callback);

    return () => {
      const set = this.tickSubscribers.get(derivSymbol);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.tickSubscribers.delete(derivSymbol);
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ forget: derivSymbol });
          }
        }
      }
    };
  }

  /**
   * Buy a Rise/Fall (Call/Put) Contract in Deriv
   */
  public buyContract(
    localMarketId: string,
    type: 'BUY' | 'SELL',
    stakeUSD: number,
    ticks: number = 5
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isAuthorized) {
        return reject(new Error('Deriv live account is not authorized. Enter API Token in Settings.'));
      }

      const derivSymbol = this.symbolMap[localMarketId] || 'R_75';
      const contractType = type === 'BUY' ? 'CALL' : 'PUT';

      // Deriv PAT Options API: send proposal with underlying_symbol then buy
      if (this.config.apiToken && this.config.apiToken.startsWith('pat_')) {
        const reqId = Date.now() + Math.floor(Math.random() * 1000);
        this.pendingProposals.set(reqId, { resolve, reject, stakeUSD });

        const sent = this.send({
          req_id: reqId,
          proposal: 1,
          amount: stakeUSD,
          basis: 'stake',
          contract_type: contractType,
          currency: 'USD',
          duration: Math.max(1, Math.min(ticks, 10)),
          duration_unit: 't',
          underlying_symbol: derivSymbol,
          subscribe: 1,
        });

        if (!sent) {
          this.pendingProposals.delete(reqId);
          return reject(new Error('WebSocket connection is not ready.'));
        }

        setTimeout(() => {
          if (this.pendingProposals.has(reqId)) {
            this.pendingProposals.delete(reqId);
            resolve({ status: 'sent_timeout_fallback' });
          }
        }, 8000);
        return;
      }

      // Legacy v3 Payload
      const payload = {
        buy: 1,
        price: stakeUSD,
        parameters: {
          amount: stakeUSD,
          basis: 'stake',
          contract_type: contractType,
          currency: 'USD',
          duration: Math.max(1, Math.min(ticks, 10)),
          duration_unit: 't',
          symbol: derivSymbol,
        },
      };

      const success = this.send(payload);
      if (!success) {
        return reject(new Error('WebSocket connection is not ready.'));
      }

      resolve({ status: 'sent', payload });
    });
  }

  public getActiveAccountId(): string {
    const isReal = this.config.accountType === 'real';
    if (isReal) {
      return this.patAccounts.real?.accountId || (this.authorizedAccount?.startsWith('ROT') ? this.authorizedAccount : 'ROT9256649227');
    }
    return this.patAccounts.demo?.accountId || (this.authorizedAccount?.startsWith('DOT') ? this.authorizedAccount : 'DOT94237631');
  }

  public getStatus() {
    const isReal = this.authorizedAccount 
      ? (this.authorizedAccount.toUpperCase().startsWith('CR') || this.authorizedAccount.toUpperCase().startsWith('ROT'))
      : false;

    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      isAuthorized: this.isAuthorized,
      loginId: this.authorizedAccount || this.getActiveAccountId(),
      appId: this.config.appId,
      endpoint: this.config.endpoint,
      useSecureWs: this.config.useSecureWs,
      hasToken: Boolean(this.config.apiToken && this.config.apiToken.length > 5),
      lastBalance: this.lastBalance,
      lastCurrency: this.lastCurrency,
      isRealAccount: isReal,
      patAccounts: this.patAccounts,
      activeAccountId: this.getActiveAccountId(),
    };
  }
}

export const derivService = new DerivWebSocketService();
