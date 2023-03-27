import { Question } from '../types/Question';
import { Submission } from '../types/Submission';

type DistributionType = {
  percentile: string;
  value: number;
};

const languagesToExtensions: Record<string, string> = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
  PostgreSQL: '.sql',
  'C++14': '.cpp',
  'C++17': '.cpp',
  'C++11': '.cpp',
  'C++98': '.cpp',
  'C++03': '.cpp',
  'C++20': '.cpp',
  'C++1z': '.cpp',
  'C++1y': '.cpp',
  'C++1x': '.cpp',
  'C++1a': '.cpp',
  CPP: '.cpp',
};

export default class GithubHandler {
  private accessToken: string;
  private username: string;
  private repo: string;

  constructor() {
    //inject QuestionHandler dependency
    //fetch github_access_token, github_username, github_leetsync_repo from storage
    //if any of them is not present, throw an error
    this.accessToken = '';
    this.username = '';
    this.repo = '';

    chrome.storage.sync.get(
      ['github_leetsync_token', 'github_username', 'github_leetsync_repo'],
      (result) => {
        if (
          !result.github_leetsync_token ||
          !result.github_username ||
          !result.github_leetsync_repo
        ) {
          console.log('❌ GithubHandler: Missing Github Credentials');
        }
        this.accessToken = result['github_leetsync_token'];
        this.username = result['github_username'];
        this.repo = result['github_leetsync_repo'];
      }
    );
  }

  public getProblemExtension(lang: string) {
    return languagesToExtensions[lang];
  }
  async fileExists(path: string, fileName: string): Promise<string | null> {
    //check if the file exists in the path using the github API
    const url = `https://api.github.com/repos/${this.username}/${this.repo}/contents/${path}/${fileName}`;

    const uploadedFile = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((x) => x.json())
      .catch((err) => console.log(err));

    if (uploadedFile.message === 'Not Found') {
      return null;
    }
    return uploadedFile.sha;
  }
  async upload(
    path: string,
    fileName: string,
    content: string,
    commitMessage: string
  ) {
    const sha = await this.fileExists(path, fileName);
    console.log(`🚀 ~ file: GithubHandler.ts:65 ~ GithubHandler ~ sha:`, sha);

    //create a new file with the content
    const url = `https://api.github.com/repos/${this.username}/${this.repo}/contents/${path}/${fileName}`;
    const data = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      sha, //if the file already exists, we need to pass the sha of the file otherwise it will be null
    };

    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((x) => x.json())
      .catch((err) => console.log(err));
  }
  async createReadmeFile(path: string, content: string, message: string) {
    //check if that file already exists
    //if it does, Update the file with the new content
    //if it doesn't, create a new file with the content
    await this.upload(path, 'README.md', content, message);
  }
  async createSolutionFile(
    path: string,
    code: string,
    problemName: string, //the code
    lang: string, //.py, .cpp, .java etc
    stats: {
      memory: number;
      memoryDisplay: string;
      memoryPercentile: number;
      runtime: number;
      runtimeDisplay: string;
      runtimePercentile: number;
    }
  ) {
    //check if that file already exists
    //if it does, Update the file with the new content
    //if it doesn't, create a new file with the content
    const msg = `Time: ${
      stats.runtimeDisplay
    } (${stats.runtimePercentile.toFixed(2)}%) | Memory: ${
      stats.memoryDisplay
    } (${stats.memoryPercentile.toFixed(2)}%) - LeetSync`;
    await this.upload(path, `${problemName}${lang}`, code, msg);
  }

  async submit(
    submission: Submission //todo: define the submission type
  ) {
    const {
      code,
      memory,
      memoryDisplay,
      memoryPercentile,
      runtime,
      runtimePercentile,
      runtimeDisplay,
      runtimeDistribution,
      lang,
      statusCode,
      question,
    } = submission;

    if (statusCode !== 10) {
      //failed submission
      console.log('❌ Failed Attempt');
      return;
    }
    //create a path for the files to be uploaded
    const basePath = `${question.titleSlug}`;

    const {
      title,
      titleSlug,
      content,
      difficulty,
      dislikes,
      likes,
      questionId,
    } = question;

    const langExtension = this.getProblemExtension(lang.verboseName);

    if (!langExtension) {
      console.log('❌ Language not supported');
      return;
    }

    await Promise.all([
      this.createReadmeFile(
        basePath,
        content,
        `Added README.md file for ${title}`
      ),
      this.createSolutionFile(
        basePath,
        code,
        question.titleSlug,
        langExtension,
        {
          memory,
          memoryDisplay,
          memoryPercentile,
          runtime,
          runtimeDisplay,
          runtimePercentile,
        }
      ),
    ]);
    //create a new readme file with the content

    chrome.storage.sync.set({
      lastSolved: { slug: titleSlug, timestamp: Date.now() },
    });

    //update the problems solved
    const { problemsSolved } = (await chrome.storage.sync.get(
      'problemsSolved'
    )) ?? { problemsSolved: [] }; //{slug: {...info}}

    chrome.storage.sync.set({
      problemsSolved: {
        ...problemsSolved,
        [titleSlug]: {
          question: {
            title,
            titleSlug,
            difficulty,
            questionId,
          },
          memory,
          memoryDisplay,
          memoryPercentile,
          runtime,
          runtimeDisplay,
          runtimePercentile,
          timestamp: Date.now(),
        },
      },
    });
    //create a new solution file with the code inside the folder
  }
}
