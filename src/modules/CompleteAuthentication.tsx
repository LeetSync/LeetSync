import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { BsGithub } from 'react-icons/bs';
import { SiLeetcode } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { GithubHandler } from '../handlers';
import { Footer } from './Footer';

const AuthorizeWithGithub = ({ nextStep }: { nextStep: Function }) => {
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already authenticated — advance automatically
  useEffect(() => {
    chrome.storage.sync.get(['github_leetsync_token'], (result) => {
      if (result.github_leetsync_token) nextStep();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    const token = pat.trim();
    if (!token) return setError('Please paste your Personal Access Token.');
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return setError('Token looks invalid. GitHub PATs start with ghp_ or github_pat_.');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}`, Accept: 'application/json' },
      });
      const user = await res.json();

      if (!res.ok || !user?.login) {
        setError('Token rejected by GitHub. Make sure it has the "repo" scope and is not expired.');
        setLoading(false);
        return;
      }

      chrome.storage.sync.set(
        { github_leetsync_token: token, github_username: user.login },
        () => nextStep()
      );
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack w="100%" spacing={4}>
      <VStack pb={2} spacing={1}>
        <Heading size="md">Connect GitHub</Heading>
        <Text color="GrayText" fontSize="sm" w="95%" textAlign="center">
          Paste a GitHub Personal Access Token with <strong>repo</strong> scope. No OAuth app
          needed — your token stays only on your device.
        </Text>
      </VStack>

      {/* Step-by-step guide */}
      <VStack
        w="95%"
        align="flex-start"
        spacing={1}
        p={3}
        bg="gray.50"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        fontSize="xs"
        color="gray.600"
      >
        <Text fontWeight="bold" color="gray.700">How to get your token:</Text>
        <Text>1. Click the button below to open GitHub</Text>
        <Text>2. Under "Token name" type: <strong>LeetSync</strong></Text>
        <Text>3. Set expiration to "No expiration" (or 1 year)</Text>
        <Text>4. Check <strong>repo</strong> → click "Generate token"</Text>
        <Text>5. Copy and paste it below</Text>
      </VStack>

      <Button
        as="a"
        href="https://github.com/settings/tokens/new?scopes=repo&description=LeetSync"
        target="_blank"
        w="95%"
        size="sm"
        variant="outline"
        colorScheme="gray"
        leftIcon={<BsGithub />}
      >
        Open GitHub Token Page ↗
      </Button>

      <FormControl isInvalid={!!error} w="95%">
        <InputGroup size="sm">
          <Input
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={pat}
            onChange={(e) => { setPat(e.target.value); setError(null); }}
            type="password"
            fontFamily="mono"
            pr="4.5rem"
          />
        </InputGroup>
        {error
          ? <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
          : <FormHelperText fontSize="xs">Your token is stored locally and never shared.</FormHelperText>
        }
      </FormControl>

      <Button
        colorScheme="blackAlpha"
        bg="blackAlpha.800"
        w="95%"
        leftIcon={<BsGithub />}
        color="whiteAlpha.900"
        border="1px solid"
        borderColor="gray.200"
        _hover={{ bg: 'blackAlpha.700' }}
        onClick={handleConnect}
        isLoading={loading}
        loadingText="Verifying…"
        isDisabled={!pat.trim() || loading}
      >
        Connect GitHub
      </Button>
      <Text fontSize="xs" color="gray.400">You can revoke this token on GitHub at any time.</Text>
    </VStack>
  );
};

const AuthorizeWithLeetCode = ({ nextStep }: { nextStep: Function }) => {
  const [leetcodeSession, setLeetcodeSession] = useState<string | null>(null);

  const handleClicked = () => {
    const authUrl = `https://leetcode.com/accounts/login/`;
    chrome.storage.sync.set({ pipe_leethub: true }, () => {
      chrome.tabs.create({ url: authUrl, active: true }, function (x) {
        chrome.tabs.getCurrent(function (tab) {
          if (!tab?.id) return;
          chrome.tabs.remove(tab?.id, function () {});
        });
      });
    });
  };
  useEffect(() => {
    if (leetcodeSession && leetcodeSession.length > 0) {
      nextStep();
    }
  }, [leetcodeSession]);

  useEffect(() => {
    chrome.storage.sync.get(['leetcode_session'], (result) => {
      if (result.leetcode_session) {
        setLeetcodeSession(result.leetcode_session);
      }
    });
  }, []);

  return (
    <VStack w="100%">
      <VStack>
        <Heading size="md">Authorize LeetCode</Heading>
        <Text color="GrayText" fontSize={'sm'} w="90%" textAlign={'center'}>
          To sync your submissions on LeetCode, we need access to your account first.
        </Text>
      </VStack>

      <Button colorScheme={'yellow'} w="100%" onClick={handleClicked} leftIcon={<SiLeetcode />}>
        Login with LeetCode
      </Button>
    </VStack>
  );
};
const SelectRepositoryStep = ({ nextStep }: { nextStep: Function }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [repositoryURL, setRepositoryURL] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLinkRepo = async () => {
    if (!repositoryURL) return setError('Repository URL is required');
    if (!accessToken) return setError('Access token is required');

    const repoName = repositoryURL.split('/').pop();
    const username = repositoryURL.split('/').slice(-2)[0];
    if (!repoName || !username) {
      return setError('Invalid repository URL');
    }

    setLoading(true);
    const github = new GithubHandler();
    const isFound = await github.checkIfRepoExists(`${username}/${repoName}`);
    setLoading(false);
    if (!isFound) {
      return setError('Repository not found');
    }
    chrome.storage.sync.set({ github_leetsync_repo: repoName }, () => {
      console.log('Repository Linked Successfully');
      navigate(0);
    });
  };

  useEffect(() => {
    chrome.storage.sync.get(['github_leetsync_token'], (result) => {
      if (!result.github_leetsync_token) return;
      setAccessToken(result.github_leetsync_token);
    });
  }, []);

  return (
    <VStack w="100%">
      <VStack>
        <Heading size="md">Link a Repository</Heading>
        <Text color="GrayText" fontSize={'sm'} w="90%" textAlign={'center'}>
          One last step, we need to know which repository you want to push your code to 🤓
        </Text>
      </VStack>

      {/* If you add the size prop to `InputGroup`, it'll pass it to all its children. */}
      <FormControl isRequired isInvalid={!!error}>
        <InputGroup size="sm">
          <Input
            placeholder="Repository URL"
            value={repositoryURL}
            onChange={(e) => {
              setRepositoryURL(e.target.value);
            }}
          />
        </InputGroup>
        {!error ? (
          <FormHelperText fontSize={'xs'}>
            Paste the repository URL to push your submissions to.
          </FormHelperText>
        ) : (
          <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
        )}
      </FormControl>
      <Button
        colorScheme={'gray'}
        w="100%"
        onClick={handleLinkRepo}
        isLoading={loading}
        isDisabled={loading || !repositoryURL}
        size="sm"
      >
        Link Repository
      </Button>
      <small>You can change this later.</small>
    </VStack>
  );
};

const StartOnboarding = ({ nextStep }: { nextStep: Function }) => {
  return (
    <VStack w="100%" h="100%" align="center" justify={'center'}>
      <Logo />
      <VStack w="100%">
        <Heading size="lg">Welcome 👋</Heading>
        <Text color="GrayText" fontSize={'sm'} w="90%" textAlign={'center'}>
          LeetSync is a Chrome extension that syncs your submissions to GitHub. Setup now.
        </Text>
      </VStack>

      <VStack w="100%" py={4}>
        <Button size="md" colorScheme={'green'} w="95%" onClick={() => nextStep()}>
          Complete Setup
        </Button>
        <Text fontSize={'xs'} color="gray.400">
          This will take less than 2 minutes
        </Text>
      </VStack>
      <Footer />
    </VStack>
  );
};

export { StartOnboarding, AuthorizeWithGithub, AuthorizeWithLeetCode, SelectRepositoryStep };
