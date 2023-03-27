interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
}
interface GithubUser {
  id: number;
  avatar_url?: string | null;
  url: string;
  username: string;
  /* other user data can be added here, but not needed for now */
}

export class GithubHandler {
  /* - This class should have the following arguments:
            0. Base url for github api
            1. The github username
            2. The github access token
            3. The selected github repository name
            4. The leetcode session
            5. Client Secret
            6. Client ID
            7. Redirect URI
        - This class should have the following methods:
            1. A method to fetch the github repositories
            2. A method to create a new repository
            3. A method to fetch the github repository files
            4. A method to create a new file in the github repository
            5. A method to update an existing file in the github repository
            6. A method to delete an existing file in the github repository
            7. A method to set the github username, token, repository name, and leetcode session
    */
  private static instance: GithubHandler;

  base_url: string = 'https://api.github.com';
  username: string | null = null;
  repository_name: string | null = null;
  leetcode_session: string | null = null;
  private github_user: GithubUser | null = null;
  private client_secret: string | null =
    '59c0adc1c144d71f387b0c7c92ca5959db65dc0b';
  private client_id: string | null = 'd1f283cbb1215486d108';
  private redirect_uri: string | null = 'https://github.com/?referrer=leetsync';

  private constructor() {}

  public static getInstance(): GithubHandler {
    if (!GithubHandler.instance) {
      GithubHandler.instance = new GithubHandler();
    }
    return GithubHandler.instance;
  }
  async authorize(code: string): Promise<GithubUser | null> {
    if (!GithubHandler.instance) {
      throw new Error('GithubHandler instance not found');
    }

    const access_token = await this.fetchAccessToken(code);
    const github_user = await this.setGithubUser(access_token);

    this.github_user = github_user;
    return this.github_user;
  }
  async authorizeUsingStorage(): Promise<GithubUser | null> {
    if (!GithubHandler.instance) {
      throw new Error('GithubHandler instance not found');
    }

    const access_token = await this.loadFromStorage();
    const github_user = await this.setGithubUser(access_token);

    this.github_user = github_user;
    return this.github_user;
  }

  async loadFromStorage(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['github_leetsync_token'], (result) => {
        const token = result['github_leetsync_token'];
        if (!token) {
          console.log('No access token found.');
          chrome.storage.sync.clear();
          resolve('');
        }
        resolve(token);
      });
    });
  }

  async fetchAccessToken(code: string) {
    //todo: check if token already exists in storage and return it
    const token = await this.loadFromStorage();

    if (token) return token;

    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const body = {
      code,
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      client_secret: this.client_secret,
    };
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
    if (!response || response.message === 'Bad credentials') {
      console.log('No access token found.');
      chrome.storage.sync.clear();
      return;
    }
    chrome.storage.sync.set(
      { github_leetsync_token: response.access_token },
      () => {
        console.log('Saved github access token.');
      }
    );
    return response.access_token;
  }

  async fetchGithubRepositories(): Promise<Repository[] | null> {
    const token = await this.loadFromStorage();
    const response = await fetch(`${this.base_url}/user/repos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `token ${token}`,
      },
    }).then((response) => response.json());

    if (!response || response.message === 'Bad credentials') {
      console.error('No access token found.');
      chrome.storage.sync.clear();
      return null;
    }
    return response;
  }
  async setGithubUser(token: string): Promise<GithubUser | null> {
    //validate the token
    const response = await fetch(`${this.base_url}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `token ${token}`,
      },
    }).then((response) => response.json());

    if (!response || response.message === 'Bad credentials') {
      console.error('No access token found.');
      chrome.storage.sync.clear();
      return null;
    }

    //set access token in chrome storage
    chrome.storage.sync.set(
      { github_leetsync_token: token, github_username: response.login },
      () => {}
    );

    const github_user: GithubUser = {
      id: response.id,
      avatar_url: response.avatar_url,
      url: response.url,
      username: response.login,
    };

    return github_user;
  }

  async getGithubUser(): Promise<GithubUser | null> {
    if (!this.github_user) {
      //load from storage
      this.github_user = await this.setGithubUser(await this.loadFromStorage());
    }
    return this.github_user;
  }
  async checkIfRepoExists(repo_name: string): Promise<boolean> {
    //check if repo exists in github user's account
    const result = await fetch(`${this.base_url}/repos/${repo_name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `token ${await this.loadFromStorage()}`,
      },
    })
      .then((x) => x.json())
      .catch((e) => console.error(e));
    if (
      result.message === 'Not Found' ||
      result.message === 'Bad credentials'
    ) {
      return false;
    }
    return true;
  }
}
