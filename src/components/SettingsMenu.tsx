import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Divider,
  FocusLock,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
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
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { BiCalendarHeart, BiTrashAlt, BiUnlink } from 'react-icons/bi';
import { CiSettings } from 'react-icons/ci';
import { GithubHandler } from '../scripts/github';

interface SettingsMenuProps {}

const SettingsMenu: React.FC<SettingsMenuProps> = () => {
  const [isOpen, setOpen] = useState<'unlink' | 'clear' | null>(null);
  const [githubUsername, setGithubUsername] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');
  const [newRepoURL, setNewRepoURL] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unlinkRepo = async () => {
    chrome.storage.sync.set(
      {
        github_leetsync_repo: null,
      },
      () => {
        setGithubRepo('');
        //refresh the page
        window.location.reload();
      }
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
    const github = GithubHandler.getInstance();
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

  useEffect(() => {
    chrome.storage.sync.get(
      ['github_username', 'github_leetsync_repo', 'github_leetsync_token'],
      (result) => {
        const { github_username, github_leetsync_repo, github_leetsync_token } =
          result;
        setGithubUsername(github_username);
        setGithubRepo(github_leetsync_repo);
        setAccessToken(github_leetsync_token);
      }
    );
  }, []);
  return (
    <Menu size={'lg'} placement='bottom-end'>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<CiSettings />}
        variant='outline'
      />
      <MenuList fontSize={'14px'}>
        <HStack px={4} py={2}>
          <Avatar name={githubUsername} size='sm' />
          <VStack spacing={0} align='flex-start'>
            <Text fontSize={'sm'} fontWeight={'semibold'}>
              {githubUsername}
            </Text>
            <Text fontSize={'xs'} color={'gray.500'}>
              {githubRepo}
            </Text>
          </VStack>
        </HStack>
        <Divider />
        <MenuGroup title='General'>
          <Popover
            isOpen={isOpen === 'unlink'}
            onClose={() => setOpen(null)}
            placement='bottom-start'
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h='100%'
                icon={<BiUnlink fontSize={'1.2rem'} />}
                minH='40px'
                onClick={() => setOpen('unlink')}
                closeOnSelect={false}
              >
                Change or Unlink Repo
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight='semibold'>
                Change or Unlink Repo
              </PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <Input
                    placeholder='New Repository URL'
                    value={newRepoURL}
                    onChange={(e) => {
                      setNewRepoURL(e.target.value);
                    }}
                    size='sm'
                  />
                  {!error ? (
                    <FormHelperText fontSize={'xs'}>
                      Paste the new repository URL.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
              <PopoverFooter display='flex' justifyContent='flex-end'>
                <HStack w='100%' justify={'space-between'}>
                  <Button
                    colorScheme={'red'}
                    variant={'outline'}
                    size='sm'
                    onClick={unlinkRepo}
                    isDisabled={loading}
                  >
                    Unlink Repo
                  </Button>
                  <ButtonGroup size='sm'>
                    <Button
                      variant='outline'
                      isLoading={loading}
                      onClick={() => setOpen(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme='green'
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

          <MenuItem
            h='100%'
            icon={<BiCalendarHeart fontSize={'1.2rem'} />}
            minH='40px'
            disabled={true}
            isDisabled
            _disabled={{ opacity: 0.75, cursor: 'not-allowed' }}
          >
            Set a reminder{' '}
            <Badge size='sm' fontSize={'xs'} colorScheme='green'>
              Soon
            </Badge>
          </MenuItem>
        </MenuGroup>
        <Divider />
        <MenuGroup title='Danger Area'>
          <Popover
            isOpen={isOpen === 'clear'}
            onClose={() => setOpen(null)}
            placement='bottom-start'
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h='100%'
                icon={<BiTrashAlt fontSize={'1.2rem'} />}
                bgColor={'red.50'}
                color='red.500'
                minH='40px'
                onClick={() => setOpen('clear')}
                closeOnSelect={false}
              >
                Reset All
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight='semibold'>
                Reset all your data
              </PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <Text fontSize={'sm'}>
                  This will reset all your data, including your linked GitHub
                  repository and solved problems data. This action cannot be
                  undone.
                </Text>
              </PopoverBody>
              <PopoverFooter display='flex' justifyContent='flex-end'>
                <ButtonGroup size='sm'>
                  <Button
                    variant='outline'
                    isLoading={loading}
                    onClick={() => setOpen(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme={'red'}
                    variant={'outline'}
                    size='sm'
                    onClick={resetAll}
                  >
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
