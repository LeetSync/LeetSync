import { Box, Center, Heading, Text } from '@chakra-ui/react';
import 'chart.js/auto';
import { ChartData } from 'chart.js/auto';
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

interface DoughnutProps {
  data: ChartData<'doughnut', number[], string>;
}

const DoughnutComponent: React.FC<DoughnutProps> = ({ data }) => {
  return (
    <Box w={'220px'} h='fit-content' pos='relative'>
      <Center
        pos='absolute'
        top='50%'
        left='50%'
        transform={'translate(-50%,-50%)'}
        flexDir='column'
      >
        <Text color='gray.400' fontWeight={'medium'}>
          Total
        </Text>
        <Heading size='xl' color='gray.700' maxW={'15ch'}>
          {data.datasets?.[0].data?.reduce((a, b) => a + b, 0)}
        </Heading>
      </Center>

      <Center>
        <Doughnut
          datasetIdKey='solvedProblems'
          data={data}
          options={{
            plugins: {
              legend: {
                display: false,
                align: 'center',
                position: 'right',
              },
            },
          }}
        />
      </Center>
    </Box>
  );
};
export default DoughnutComponent;
