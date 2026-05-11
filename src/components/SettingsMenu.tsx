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
import browser from 'webextension-polyfill';

import { BiCalendarHeart, BiTrashAlt, BiUnlink } from 'react-icons/bi';
import { CiSettings } from 'react-icons/ci';
import { TbSlashes } from 'react-icons/tb';

import { GithubHandler } from '../handlers';
import { CustomEditableComponent } from './Editable';

interface SettingsMenuProps {}

const SettingsMenu: React.FC<SettingsMenuProps> = () => {
  const [subdirectory, setSubdirectoryValue] = useState<string | null>(null);

  const [isOpen, setOpen] = useState<'unlink' | 'clear' | 'subdirectory' | null>(null);

  const [githubUsername, setGithubUsername] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [newRepoURL, setNewRepoURL] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define the expected structure of the storage result
  interface StorageResult {
    github_username?: string;
    github_leetsync_repo?: string;
    github_leetsync_token?: string;
    github_leetsync_subdirectory?: string | null;
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = (await browser.storage.sync.get([
          'github_username',
          'github_leetsync_repo',
          'github_leetsync_token',
          'github_leetsync_subdirectory',
        ])) as StorageResult;

        // Destructure with default values
        const {
          github_username = '',
          github_leetsync_repo = '',
          github_leetsync_token = '',
          github_leetsync_subdirectory = null,
        } = result;

        // Update state with the retrieved values
        setGithubUsername(github_username);
        setGithubRepo(github_leetsync_repo);
        setAccessToken(github_leetsync_token);
        setSubdirectoryValue(github_leetsync_subdirectory);
      } catch (err) {
        console.error('Load storage error:', err);
      }
    };

    loadSettings();
  }, []);

  // =========================
  // UNLINK REPO
  // =========================

  const unlinkRepo = async () => {
    try {
      await browser.storage.sync.set({
        github_leetsync_repo: null,
      });

      setGithubRepo('');

      window.location.reload();
    } catch (err) {
      console.error('Unlink repo error:', err);
    }
  };

  // =========================
  // LINK REPO
  // =========================

  const handleLinkRepo = async () => {
    try {
      setError('');

      if (!newRepoURL) {
        setError('Repository URL is required');
        return;
      }

      if (!accessToken) {
        setError('Access token is required');
        return;
      }

      const repoName = newRepoURL.split('/').pop();
      const username = newRepoURL.split('/').slice(-2)[0];

      if (!repoName || !username) {
        setError('Invalid repository URL');
        return;
      }

      setLoading(true);

      const github = new GithubHandler();

      const isFound = await github.checkIfRepoExists(`${username}/${repoName}`);

      setLoading(false);

      if (!isFound) {
        setError('Repository not found');
        return;
      }

      await browser.storage.sync.set({
        github_leetsync_repo: repoName,
      });

      console.log('✅ Repository Linked Successfully');

      setGithubRepo(repoName);

      setOpen(null);
    } catch (err) {
      console.error(err);
      setError('Failed to link repository');
      setLoading(false);
    }
  };

  // =========================
  // RESET ALL
  // =========================

  const resetAll = async () => {
    try {
      await browser.storage.sync.clear();

      window.location.reload();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // =========================
  // TRIM SUBDIRECTORY
  // =========================

  const trimSubdirectory = (text: string) => {
    return text.replace(/^\/+|\/+$/g, '');
  };

  // =========================
  // SAVE SUBDIRECTORY
  // =========================

  const saveSubdirectory = async () => {
    try {
      setLoading(true);
      setError('');

      if (subdirectory === '' || subdirectory === null) {
        await browser.storage.sync.remove('github_leetsync_subdirectory');

        setLoading(false);

        return;
      }

      if (!subdirectory.match(/^[a-zA-Z0-9-_/]+$/)) {
        setLoading(false);

        setError('Invalid subdirectory');

        return;
      }

      await browser.storage.sync.set({
        github_leetsync_subdirectory: trimSubdirectory(subdirectory),
      });

      setLoading(false);
    } catch (err) {
      console.error(err);

      setError('Failed to save subdirectory');

      setLoading(false);
    }
  };

  // =========================
  // LOAD STORAGE DATA
  // =========================

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = (await browser.storage.sync.get([
          'github_username',
          'github_leetsync_repo',
          'github_leetsync_token',
          'github_leetsync_subdirectory',
        ])) as StorageResult;

        // Destructure with default values
        const {
          github_username = '',
          github_leetsync_repo = '',
          github_leetsync_token = '',
          github_leetsync_subdirectory = null,
        } = result;

        // Update state with the retrieved values
        setGithubUsername(github_username);
        setGithubRepo(github_leetsync_repo);
        setAccessToken(github_leetsync_token);
        setSubdirectoryValue(github_leetsync_subdirectory);
      } catch (err) {
        console.error('Load storage error:', err);
      }
    };

    loadData();
  }, []);

  if (!githubUsername || !githubRepo || !accessToken) {
    return null;
  }

  return (
    <Menu size={'lg'} placement="bottom-end">
      <MenuButton as={IconButton} aria-label="Options" icon={<CiSettings />} variant="outline" />

      <MenuList fontSize={'14px'}>
        <HStack px={4} py={2}>
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

        <Divider />

        <MenuGroup title="General">
          {/* ========================= */}
          {/* CHANGE / UNLINK REPO */}
          {/* ========================= */}

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
                    onChange={(e) => setNewRepoURL(e.target.value)}
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
                  <Button
                    colorScheme={'red'}
                    variant={'outline'}
                    size="sm"
                    onClick={unlinkRepo}
                    isDisabled={loading}
                  >
                    Unlink Repo
                  </Button>

                  <ButtonGroup size="sm">
                    <Button variant="outline" isLoading={loading} onClick={() => setOpen(null)}>
                      Cancel
                    </Button>

                    <Button
                      colorScheme="green"
                      onClick={handleLinkRepo}
                      isDisabled={loading || !newRepoURL}
                    >
                      Save
                    </Button>
                  </ButtonGroup>
                </HStack>
              </PopoverFooter>
            </PopoverContent>
          </Popover>

          {/* ========================= */}
          {/* SUBDIRECTORY */}
          {/* ========================= */}

          <Popover
            isOpen={isOpen === 'subdirectory'}
            onClose={() => setOpen(null)}
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <Tooltip label="You can now specify a subdirectory in your repo where your next submissions will be uploaded.">
                <MenuItem
                  h="100%"
                  icon={<TbSlashes fontSize={'1.2rem'} />}
                  minH="40px"
                  onClick={() => setOpen('subdirectory')}
                  closeOnSelect={false}
                >
                  Set a subdirectory
                </MenuItem>
              </Tooltip>
            </PopoverTrigger>

            <PopoverContent zIndex={10000} w="400px" paddingBottom={'1rem'}>
              <PopoverHeader fontWeight="semibold">Set Subdirectory</PopoverHeader>

              <Text fontSize="sm" padding="2">
                If you set it to <Code fontSize="xs">/LinkedList/Easy</Code>, your next submissions
                will be uploaded there.
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
                      Your next submissions will be uploaded at{' '}
                      <Code fontSize="xs">
                        {`leetcode-problem-solving/${
                          (subdirectory && trimSubdirectory(subdirectory)) || ''
                        }`}
                      </Code>
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* ========================= */}
          {/* REMINDER */}
          {/* ========================= */}

          <MenuItem
            h="100%"
            icon={<BiCalendarHeart fontSize={'1.2rem'} />}
            minH="40px"
            onClick={() => window.open('https://strawpoll.com/polls/wAg3AEW0Oy8', '_blank')}
          >
            Set a reminder
            <Badge size="sm" fontSize={'xs'} colorScheme="gray" ml={2}>
              Soon 🤩
            </Badge>
          </MenuItem>
        </MenuGroup>

        <Divider />

        {/* ========================= */}
        {/* DANGER AREA */}
        {/* ========================= */}

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
                  This will reset all your data, including your linked GitHub repository and solved
                  problems data. This action cannot be undone.
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
