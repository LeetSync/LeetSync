import { HStack, Text } from '@chakra-ui/react';
import React from 'react';

export const Footer = () => {
  return (
    <HStack align='center'>
      <Text fontSize={'12px'}>
        Having Issues?{' '}
        <Text
          as='a'
          color='blue.500'
          href='https://github.com/3ba2ii/LeetSync/issues/new'
          target='_blank'
          fontWeight={'semibold'}
        >
          Report Bug
        </Text>{' '}
        | Made with <span style={{ color: '#e25555' }}>&#9829;</span> by{' '}
        <Text
          as='a'
          color='blue.500'
          href='https://github.com/3ba2ii'
          target='_blank'
          fontWeight={'semibold'}
          display='inline-block'
        >
          @3ba2ii
        </Text>
      </Text>
    </HStack>
  );
};
