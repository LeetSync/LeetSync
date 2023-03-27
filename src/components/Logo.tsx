import { Image, ImageProps } from '@chakra-ui/react';
import React from 'react';
import logo from '../assets/logo.svg';

interface LogoProps {
  logoProps?: ImageProps;
}

const Logo: React.FC<LogoProps> = ({ logoProps }) => {
  return <Image src={logo} alt='LeetSync' {...logoProps} />;
};
export default Logo;
