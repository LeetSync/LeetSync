import { Box, Container, Heading, HStack, IconButton, Image, Link, Text, Tooltip, VStack } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { BiLink } from 'react-icons/bi';
import { CiSettings } from 'react-icons/ci';
import DoughnutComponent from '../components/Doughnut';
import SettingsMenu from '../components/SettingsMenu';
import StreakCounter from '../components/StreakCounter';
import { formatProblemsPerDay, generateTitle, getTotalNumberOfStreaks } from '../utils/streak.helper';
import { capitalize } from '../utils/string-manipulation.helper';
import { Footer } from './Footer';
import flameGif from '../assets/flame.gif';

interface DashboardProps {}

const LinkedGithubComponents = () => {
  const [githubUsername, setGithubUsername] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');

  useEffect(() => {
    chrome.storage.sync.get(['github_username', 'github_leetsync_repo'], (result) => {
      const { github_username, github_leetsync_repo } = result;
      setGithubUsername(github_username);
      setGithubRepo(github_leetsync_repo);
    });
  }, []);

  return (
    <Box>
      <Text fontSize={'xs'}>
        Linked with{' '}
        <Link
          href={`https://github.com/${githubUsername}/${githubRepo}`}
          target="_blank"
          fontWeight={'semibold'}
          fontFamily={'Mono, monospace, sans-serif'}
        >
          {githubUsername}/{githubRepo}
        </Link>
        , Unlink by clicking{' '}
        <IconButton
          aria-label="Settings"
          icon={<CiSettings />}
          size="xs"
          variant="outline"
          colorScheme={'gray'}
          color="gray.300"
          fontSize={'sm'}
        />{' '}
        on the top right corner
      </Text>
    </Box>
  );
};
const Dashboard: React.FC<DashboardProps> = ({}) => {
  const [solvedProblems, setSolvedProblems] = React.useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [streak, setStreak] = React.useState(0);
  const [problemsPerDay, setProblemsPerDay] = React.useState<{
    [date: string]: number;
  }>();
  const [githubUsername, setGithubUsername] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');

  const solvedProblemsToday = problemsPerDay?.[new Date().toLocaleDateString()] || 0;

  React.useEffect(() => {
    chrome.storage.sync.get(['solvedProblems', 'github_username', 'github_leetsync_repo'], (result) => {
      const { solvedProblems, github_username, github_leetsync_repo } = result;
      setGithubUsername(github_username);
      setGithubRepo(github_leetsync_repo);
      if (!solvedProblems) return;
      let [easy, medium, hard] = [0, 0, 0];

      easy = solvedProblems.questionsSolved.Easy;
      medium = solvedProblems.questionsSolved.Medium;
      hard = solvedProblems.questionsSolved.Hard;

      setSolvedProblems({
        easy,
        medium,
        hard,
      });

      const problemsPerDay = formatProblemsPerDay(solvedProblems.streakInfo); //[8/9/2024: 1, 8/7/2024: 1, 8/8/2024: 2, 8/11/2024: 1]
      console.log(problemsPerDay);
      const streaksCount = getTotalNumberOfStreaks(problemsPerDay);
      setProblemsPerDay(problemsPerDay);
      setStreak(streaksCount);
    });
  }, []);

  return (
    <Container
      w="650px"
      h="fit-content"
      paddingY={'25px'}
      border="1px solid"
      borderColor={'gray.200'}
      borderRadius={'lg'}
      boxShadow={'md'}
      pos="relative"
    >
      <Box pos="absolute" top="24px" right="16px">
        <SettingsMenu />
      </Box>
      <VStack w="100%" h="100%" align="flex-start" justify={'flex-start'} spacing={8}>
        <HStack w="100%" align={'center'}>
          {solvedProblemsToday ? (
            <Box>
              <Image src={flameGif} alt="flame" height={`5rem`} width="fit-content" objectFit={'contain'} />
            </Box>
          ) : (
            <Tooltip label="Start your flame right now by solving your first problem today!">
              <Heading size="3xl">&#128064;</Heading>
            </Tooltip>
          )}
          <Box textAlign="left">
            <HStack spacing={0} align="center">
              <Heading size="lg" fontWeight={'black'}>
                {streak > 0 ? `${streak} day streak!` : 'Start your streak!'}
              </Heading>
              <Tooltip label={<LinkedGithubComponents />}>
                <IconButton
                  variant={'link'}
                  aria-label="link"
                  icon={<BiLink />}
                  size="lg"
                  onClick={() => {
                    window.open(`https://github.com/${githubUsername}/${githubRepo}`, '_blank');
                  }}
                />
              </Tooltip>
            </HStack>
            <Text color="gray.600" fontSize={'sm'}>
              {!solvedProblemsToday ? 'Do one more, and keep up the streak!' : generateTitle(streak)[1]}
            </Text>
          </Box>
        </HStack>
        <HStack w="100%" align="center" justify={'center'}>
          <StreakCounter problemsPerDay={problemsPerDay} />
        </HStack>
        <VStack w="100%" align="flex-start" spacing={4}>
          <HStack h="fit-content" w="100%" align="center" justify="space-around">
            <DoughnutComponent
              data={{
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [
                  {
                    borderWidth: 1,
                    backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 99, 132, 1)'],
                    label: 'Solved Problems',
                    data: [solvedProblems.easy, solvedProblems.medium, solvedProblems.hard],
                  },
                ],
              }}
            />

            <VStack w="fit-content" align="flex-start" justify={'space-evenly'} textAlign={'left'} gap={2}>
              {Object.entries(solvedProblems).map(([key, value]) => (
                <Box w="100%" key={key}>
                  <Text color="gray.500" fontSize={'md'}>
                    {capitalize(key)}
                  </Text>
                  <Text fontSize={'2xl'} fontWeight={'bold'}>
                    {value}
                  </Text>
                </Box>
              ))}
            </VStack>
          </HStack>
        </VStack>
        <HStack w="100%" align={'center'} justify="center">
          <Footer />
        </HStack>
      </VStack>
    </Container>
  );
};
export default Dashboard;
