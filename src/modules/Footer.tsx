import { VStack, Text, HStack } from '@chakra-ui/react';
import React from 'react';

export const Footer = () => {
  return (
    <VStack align="center">
      <HStack>
        <Text fontSize={'12px'}>
          Having Issues?{' '}
          <Text
            as="a"
            color="blue.500"
            href="https://github.com/disturbedlord/LeetSync/issues/new/choose"
            target="_blank"
            fontWeight={'semibold'}
          >
            Report Bug
          </Text>{' '}
          | Made with <span style={{ color: '#e25555' }}>&#9829;</span> by{' '}
          <Text
            as="a"
            color="blue.500"
            href="https://github.com/disturbedlord"
            target="_blank"
            fontWeight={'semibold'}
            display="inline-block"
          >
            @disturbedlord
          </Text>
        </Text>
      </HStack>
      <HStack>
        <Text fontSize={'12px'}>
          Forked From{' '}
          <Text
            as="a"
            color="blue.500"
            href="https://github.com/LeetSync/LeetSync"
            target="_blank"
            fontWeight={'semibold'}
          >
            LeetSync{' '}
          </Text>
          by{' '}
          <Text
            as="a"
            color="blue.500"
            href="https://github.com/3ba2ii"
            target="_blank"
            fontWeight={'semibold'}
            display="inline-block"
          >
            @3ba2ii
          </Text>
        </Text>
      </HStack>
    </VStack>
  );
};
