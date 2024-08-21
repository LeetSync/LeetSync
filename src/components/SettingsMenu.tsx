import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Code,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { BiCalendarHeart, BiTrashAlt, BiUnlink } from 'react-icons/bi';
import { CiSettings } from 'react-icons/ci';
import { TbSlashes } from 'react-icons/tb';
import { IoSync } from 'react-icons/io5';
import { GithubHandler, LeetCodeHandler } from '../handlers';
import { CustomEditableComponent } from './Editable';

interface SettingsMenuProps {}

const SettingsMenu: React.FC<SettingsMenuProps> = () => {
  const [subdirectory, setSubdirectoryValue] = useState<string | null>(null);

  const [isOpen, setOpen] = useState<'unlink' | 'clear' | 'subdirectory' | null>(null);
  const [githubUsername, setGithubUsername] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');
  const [newRepoURL, setNewRepoURL] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const github = new GithubHandler();
  const leetcode = new LeetCodeHandler();

  const unlinkRepo = async () => {
    chrome.storage.sync.set(
      {
        github_leetsync_repo: null,
      },
      () => {
        setGithubRepo('');
        //refresh the page
        window.location.reload();
      },
    );
  };
  const handleLinkRepo = async () => {
    if (!newRepoURL) return setError('Repository URL is required');
    if (!accessToken) return setError('Access token is required');

    const repoName = newRepoURL.split('/').pop();
    const username = newRepoURL.split('/').slice(-2)[0];
    if (!repoName || !username) {
      return setError('Invalid repository URL');
    }

    setLoading(true);
    const isFound = await github.checkIfRepoExists(`${username}/${repoName}`);
    setLoading(false);
    if (!isFound) {
      return setError('Repository not found');
    }
    chrome.storage.sync.set({ github_leetsync_repo: repoName }, () => {
      console.log('Repository Linked Successfully');
      setGithubRepo(repoName);
      setOpen(null);
    });
  };
  const resetAll = () => {
    chrome.storage.sync.clear(() => {
      window.location.reload();
    });
  };

  const trimSubdirectory = (text: string) => {
    return text.replace(/^\/+|\/+$/g, '');
  };

  const saveSubdirectory = async () => {
    setLoading(true);
    //validate the subdirectory
    if (subdirectory === '' || subdirectory === null) {
      //this means the user wants to remove the subdirectory
      await chrome.storage.sync.remove('github_leetsync_subdirectory');
      setLoading(false);
      return;
    }
    if (!subdirectory?.match(/^[a-zA-Z0-9-_/]+$/)) {
      setLoading(false);

      return setError('Invalid subdirectory');
    }

    await chrome.storage.sync.set({
      github_leetsync_subdirectory: trimSubdirectory(subdirectory),
    });
    setLoading(false);
  };

  const getUnionList = (allQuestions: string[], solvedQuestions: string[]): string[] => {
    //["premier-league-table-ranking|3246|1",...]
    //["folderName",...]
    let unionSet: string[] = [];

    solvedQuestions.forEach((que: string) => {
      let slug: string = que.substr(que.indexOf('-') + 1); // Question Slug
      let questionId: string = que.split('-')[0];
      allQuestions.forEach((lq) => {
        if (lq.startsWith(que)) unionSet.push(que);
      });
    });

    return unionSet;
  };

  const reSyncData = async () => {
    const allQuestionInGithub = await github.getAllFolders();
    let allLeetcodeQuestion: string[] = [];

    chrome.storage.local.get(['allLeetcodeQuestions'], (result) => {
      allLeetcodeQuestion = result['allLeetcodeQuestions'];
    });

    if (allLeetcodeQuestion === undefined || allLeetcodeQuestion.length == 0) {
      console.log('Leetcode Question List not Available, fetching them...');
      await leetcode
        .getAllQuestion()
        .then((res) => {
          allLeetcodeQuestion = res;
          chrome.storage.local.set({ allLeetcodeQuestions: allLeetcodeQuestion });
          console.log('Leetcode Question Updated');
        })
        .catch((err) => console.log('Leetcode Question Fetch Error : ', err));
    }

    let solvedQuestions: string[] = getUnionList(allLeetcodeQuestion, allQuestionInGithub);

    console.log(allLeetcodeQuestion, allQuestionInGithub, solvedQuestions);

    const metadata = await github.getMetadataFile();
    if (metadata.length !== 0) {
      let difficultyMapping: any = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
      };
      const timeStamps = new Set();
      let metadataQuestions = metadata.split('\n');
      metadataQuestions = metadataQuestions.splice(0, metadataQuestions.length - 1);
      metadataQuestions.forEach((p) => {
        const data = p.split('|');
        timeStamps.add(Number.parseInt(data[2]));
        difficultyMapping[data[1]]++;
      });

      const solvedProblems = {
        questionsSolved: {
          Easy: difficultyMapping['Easy'],
          Medium: difficultyMapping['Medium'],
          Hard: difficultyMapping['Hard'],
        },
        streakInfo: Array.from(timeStamps),
      };

      console.log('To Be Updated ', solvedProblems);
      chrome.storage.sync.set({ solvedProblems: solvedProblems }).then((res) => window.location.reload());
    }

    // allSolvedQuestionInGithub.forEach((que : any) => {
    //   const difficulty =
    // })
  };

  useEffect(() => {
    chrome.storage.sync.get(
      ['github_username', 'github_leetsync_repo', 'github_leetsync_token', 'github_leetsync_subdirectory'],
      (result) => {
        const { github_username, github_leetsync_repo, github_leetsync_token, github_leetsync_subdirectory } = result;
        setGithubUsername(github_username);
        setGithubRepo(github_leetsync_repo);
        setAccessToken(github_leetsync_token);
        setSubdirectoryValue(github_leetsync_subdirectory);
      },
    );
  }, []);

  if (!githubUsername || !githubRepo || !accessToken) return null;
  return (
    <Menu size={'lg'} placement="bottom-end">
      <MenuButton as={IconButton} aria-label="Options" icon={<CiSettings />} variant="outline" />
      <MenuList fontSize={'14px'}>
        <HStack px={4} py={2} justify={'space-between'}>
          <HStack>
            <Avatar name={githubUsername} size="sm" />
            <VStack spacing={0} align="flex-start">
              <Text fontSize={'sm'} fontWeight={'semibold'}>
                {githubUsername}
              </Text>
              <Text fontSize={'xs'} color={'gray.500'}>
                {githubRepo}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            <Tooltip label="Resync Extension">
              <IconButton aria-label="Resync" icon={<IoSync />} onClick={() => reSyncData()} />
            </Tooltip>
          </HStack>
        </HStack>
        <Divider />
        <MenuGroup title="General">
          <Popover
            isOpen={isOpen === 'unlink'}
            onClose={() => setOpen(null)}
            placement="bottom-start"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h="100%"
                icon={<BiUnlink fontSize={'1.2rem'} />}
                minH="40px"
                onClick={() => setOpen('unlink')}
                closeOnSelect={false}
              >
                Change or unlink repo
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight="semibold">Change or unlink repo</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <Input
                    placeholder="New Repository URL"
                    value={newRepoURL}
                    onChange={(e) => {
                      setNewRepoURL(e.target.value);
                    }}
                    size="sm"
                  />
                  {!error ? (
                    <FormHelperText fontSize={'xs'}>Paste the new repository URL.</FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <HStack w="100%" justify={'space-between'}>
                  <Button colorScheme={'red'} variant={'outline'} size="sm" onClick={unlinkRepo} isDisabled={loading}>
                    Unlink Repo
                  </Button>
                  <ButtonGroup size="sm">
                    <Button variant="outline" isLoading={loading} onClick={() => setOpen(null)}>
                      Cancel
                    </Button>
                    <Button colorScheme="green" onClick={handleLinkRepo} isDisabled={loading || !newRepoURL}>
                      Save
                    </Button>
                  </ButtonGroup>
                </HStack>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
          <Popover isOpen={isOpen === 'subdirectory'} onClose={() => setOpen(null)} closeOnBlur={false}>
            <PopoverTrigger>
              <Tooltip label="You can now specify a subdirectory in you repo where your next submissions will be uploaded to.">
                <MenuItem
                  h="100%"
                  icon={<TbSlashes fontSize={'1.2rem'} />}
                  minH="40px"
                  onClick={() => setOpen('subdirectory')}
                  closeOnSelect={false}
                >
                  Set a subdirectory{' '}
                </MenuItem>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent zIndex={10000} w="400px" paddingBottom={'1rem'}>
              <PopoverHeader fontWeight="semibold">Set Subdirectory</PopoverHeader>
              <Text fontSize="sm" padding="2">
                if you set it to <Code fontSize="xs">/LinkedList/Easy</Code>, your next submissions will be uploaded
                there.
              </Text>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <InputGroup size="sm">
                    <CustomEditableComponent
                      value={subdirectory || ''}
                      defaultValue={subdirectory || ''}
                      onChange={(value) => setSubdirectoryValue(value)}
                      onSubmit={saveSubdirectory}
                      props={{
                        isDisabled: loading,
                        placeholder: 'No subdirectory set',
                      }}
                    />
                  </InputGroup>
                  {!error ? (
                    <FormHelperText fontSize={'xs'}>
                      You next submissions will be uploaded at{' '}
                      <Code fontSize="xs">
                        {`3ba2ii/leetcode-problem-solving/${(subdirectory && trimSubdirectory(subdirectory)) || ''}`}
                      </Code>
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <MenuItem
            h="100%"
            icon={<BiCalendarHeart fontSize={'1.2rem'} />}
            minH="40px"
            onClick={() => window.open('https://strawpoll.com/polls/wAg3AEW0Oy8', '_blank')}
          >
            Set a reminder{' '}
            <Badge size="sm" fontSize={'xs'} colorScheme="gray">
              Soon 🤩
            </Badge>
          </MenuItem>
        </MenuGroup>
        <Divider />
        <MenuGroup title="Danger Area">
          <Popover
            isOpen={isOpen === 'clear'}
            onClose={() => setOpen(null)}
            placement="bottom-start"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h="100%"
                icon={<BiTrashAlt fontSize={'1.2rem'} />}
                bgColor={'red.50'}
                color="red.500"
                minH="40px"
                onClick={() => setOpen('clear')}
                closeOnSelect={false}
              >
                Reset All
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight="semibold">Reset all your data</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <Text fontSize={'sm'}>
                  This will reset all your data, including your linked GitHub repository and solved problems data. This
                  action cannot be undone.
                </Text>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <ButtonGroup size="sm">
                  <Button variant="outline" isLoading={loading} onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button colorScheme={'red'} variant={'outline'} size="sm" onClick={resetAll}>
                    I understand, Reset All
                  </Button>
                </ButtonGroup>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};
export default SettingsMenu;
