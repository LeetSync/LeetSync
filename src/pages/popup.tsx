import { CircularProgress, Container, Heading, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  AuthorizeWithGtihub,
  AuthorizeWithLeetCode,
  SelectRepositoryStep,
  StartOnboarding,
} from '../modules/CompleteAuthentication';
import Dashboard from '../modules/Dashboard';
import { OnboardingLayout } from '../modules/OnboardingLayout';

interface PopupProps {}

type UserGlobalData = {
  github_leetsync_token: string;
  github_username: string;
  github_leetsync_repo: string;
  leetcode_session: string;
};

const hasCompletedRequirements = (userData: Partial<UserGlobalData>): boolean => {
  return !!(
    userData.github_leetsync_token &&
    userData.github_username &&
    userData.github_leetsync_repo &&
    userData.leetcode_session
  );
};

const getUserData = async (): Promise<Partial<UserGlobalData>> => {
  let userData: Partial<UserGlobalData> = {};

  await chrome.storage.sync
    .get(['github_leetsync_token', 'github_username', 'github_leetsync_repo', 'leetcode_session'])
    .then((result) => {
      userData = {
        github_leetsync_token: result.github_leetsync_token,
        github_username: result.github_username,
        github_leetsync_repo: result.github_leetsync_repo,
        leetcode_session: result.leetcode_session,
      };
    });

  return userData;
};

const NUMBER_OF_STEPS = 3;

const PopupPage: React.FC<PopupProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const [step, setSteps] = useState(1);
  const [startedOnboarding, setStartedOnboarding] = useState(false);

  const nextStep = () => {
    setSteps(Math.min(step + 1, NUMBER_OF_STEPS));
  };

  const renderStep = () => {
    if (step === 1) {
      return <AuthorizeWithGtihub nextStep={nextStep} />;
    }
    if (step === 2) {
      return <AuthorizeWithLeetCode nextStep={nextStep} />;
    }
    if (step === 3) {
      return <SelectRepositoryStep nextStep={nextStep} />;
    }
  };

  useEffect(() => {
    setIsLoading(true);

    getUserData().then((result) => {
      if (result && hasCompletedRequirements(result)) {
        setIsSynced(true);
      }
      setIsLoading(false);
    });
  }, [step]);

  useEffect(() => {
    chrome.storage.sync.set({ leetsync_started_onboarding: startedOnboarding });
  }, [startedOnboarding]);

  useEffect(() => {
    chrome.storage.sync.get('leetsync_started_onboarding', (result) => {
      setStartedOnboarding(result.leetsync_started_onboarding);
    });
  }, []);

  useEffect(() => {
    try {
      getUserData().then((result) => {
        setIsLoading(false);
        if (result && hasCompletedRequirements(result)) {
          setIsSynced(true);
        }
        let newStep = 3;
        if (!result.github_leetsync_token && !result.github_username) {
          newStep = 1;
        } else if (!result.leetcode_session) {
          newStep = 2;
        }
        setSteps(newStep);
      });
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      setError('An error occurred while trying to fetch your data.');
    }
  }, []);

  // if session still valid (skip login)
  if (isSynced) {
    return <Dashboard />;
  }

  //todo: add error boundary
  if (error) {
    return <Heading>{error}</Heading>;
  }

  return (
    <Container
      w="450px"
      paddingTop={'50px'}
      paddingBottom={'25px'}
      border="1px solid"
      borderColor={'gray.200'}
      borderRadius={'lg'}
      boxShadow={'md'}
      pos="relative"
    >
      <VStack w="100%" h="100%" align="center" justify={'center'}>
        {isLoading ? (
          <CircularProgress color="green" isIndeterminate />
        ) : startedOnboarding ? (
          <OnboardingLayout step={step} totalSteps={NUMBER_OF_STEPS}>
            {renderStep()}
          </OnboardingLayout>
        ) : (
          <StartOnboarding setStartedOnboarding={setStartedOnboarding} />
        )}
      </VStack>
    </Container>
  );
};
export default PopupPage;
