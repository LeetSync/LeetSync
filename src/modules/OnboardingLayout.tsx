import { Container, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import Logo from '../components/Logo';
import { Footer } from './Footer';

export const OnboardingLayout = ({
  children,
  step,
  totalSteps,
}: {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
}) => {
  return (
    <Container
      maxW="container.md"
      h="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <VStack>
        <Logo />
        <Text color="GrayText" fontSize={'sm'} w="90%" textAlign={'center'}>
          Step {step} / {totalSteps}
        </Text>
      </VStack>

      <VStack w="100%" spacing={5} mt={5}>
        {children}
        <Footer />
      </VStack>
    </Container>
  );
};
