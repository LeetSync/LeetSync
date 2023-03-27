import { Image, ImageProps } from '@chakra-ui/react';
import React from 'react';
import logo from '../assets/wide-logo.png';

interface LogoProps {
  logoProps?: ImageProps;
}

const Logo: React.FC<LogoProps> = ({ logoProps }) => {
  return (
    <Image
      src={logo}
      alt='LeetSync'
      {...logoProps}
      maxW='160px'
      borderRadius={'50%'}
      boxShadow={'dark-lg'}
      mb={'0.5rem'}
    />
  );
};
export default Logo;
