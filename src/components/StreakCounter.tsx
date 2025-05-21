import { Heading, HStack, VStack } from '@chakra-ui/react';
import React from 'react';
import { AiFillCheckCircle, AiFillCloseCircle, AiTwotoneCheckCircle } from 'react-icons/ai';

interface StreakCounterProps {
  problemsPerDay?: { [date: string]: number };
}
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
let today = new Date();

const StreakCounter: React.FC<StreakCounterProps> = ({ problemsPerDay }) => {
  const [streak, setStreak] = React.useState([false, false, false, false, false]);

  React.useEffect(() => {
    setStreak([false, false, true, true, false]);
  }, []);
  return (
    <HStack>
      {/* Iterate over the last 5 days of week and show them */}
      {Array.of(4, 3, 2, 1, 0).map((dayIdx, idx) => {
        const date = new Date(Date.now() - 86400000 * dayIdx);
        return (
          <VStack key={idx}>
            <Heading size="md" color="gray.400" fontWeight={'semibold'}>
              {DAYS_OF_WEEK[date.getDay()]}
            </Heading>

            {problemsPerDay?.[date.toLocaleDateString()] ? (
              <AiFillCheckCircle size={'50px'} color="#FCC34A" />
            ) : idx === streak.length - 1 ? (
              <AiTwotoneCheckCircle size={'50px'} color="#E8E4E4" />
            ) : (
              <AiFillCloseCircle size={'50px'} color="#E8E4E4" />
            )}
          </VStack>
        );
      })}
    </HStack>
  );
};
export default StreakCounter;
