'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  Stack,
  useToast,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  InputGroup,
  InputLeftAddon,
  Image,
  ButtonGroup,
  IconButton,
  Flex,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';

type InvestmentPeriod = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

interface PeriodConfig {
  daysInPeriod: number;
  label: string;
  calculateNextDate?: (currentDate: Date) => Date;
}

interface CoinPrice {
  date: string;
  price: number;
}

interface ChartData {
  date: string;
  portfolioValue: number;
  coinPrice: number;
  investedAmount: number;
  coinAmount: number;
}

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  icon: string;
}

const PERIOD_CONFIGS: Record<InvestmentPeriod, PeriodConfig> = {
  daily: { 
    daysInPeriod: 1, 
    label: '매일',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }
  },
  weekly: { 
    daysInPeriod: 7, 
    label: '매주',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    }
  },
  biweekly: { 
    daysInPeriod: 14, 
    label: '매 2주',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 14);
      return nextDate;
    }
  },
  monthly: { 
    daysInPeriod: 30, 
    label: '매월',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    }
  },
  yearly: { 
    daysInPeriod: 365, 
    label: '매년',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    }
  },
  custom: { 
    daysInPeriod: 0, 
    label: '커스텀',
    calculateNextDate: (currentDate: Date) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + customDays);
      return nextDate;
    }
  },
};

const COINS: CoinInfo[] = [
  { id: 'BTCUSDT', symbol: 'BTC', name: '비트코인', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'ETHUSDT', symbol: 'ETH', name: '이더리움', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'BNBUSDT', symbol: 'BNB', name: '바이낸스 코인', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { id: 'XRPUSDT', symbol: 'XRP', name: '리플', icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  { id: 'ADAUSDT', symbol: 'ADA', name: '카르다노', icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { id: 'SOLUSDT', symbol: 'SOL', name: '솔라나', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { id: 'DOGEUSDT', symbol: 'DOGE', name: '도지코인', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
];

const selectStyles = {
  fontSize: { base: 'lg', md: 'md' },
  height: { base: '56px', md: '48px' },
  sx: {
    'option': {
      fontSize: { base: 'lg', md: 'md' },
      padding: '12px',
      backgroundColor: 'white',
      _hover: {
        backgroundColor: 'blue.50',
      }
    }
  }
};

const inputStyles = {
  height: { base: '56px', md: '48px' },
  fontSize: { base: 'lg', md: 'md' },
};

const labelStyles = {
  fontSize: { base: 'lg', md: 'md' },
  fontWeight: 'medium',
};

export default function Home() {
  const [periodicInvestment, setPeriodicInvestment] = useState<number>(100000);
  const [startDate, setStartDate] = useState<string>('2020-01-01');
  const [endDate, setEndDate] = useState<string>(getYesterdayDate());
  const [investmentPeriod, setInvestmentPeriod] = useState<InvestmentPeriod>('monthly');
  const [customDays, setCustomDays] = useState<number>(1);
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo>(COINS[0]);
  
  // 차트 확대/축소 관련 상태
  const [chartLeft, setChartLeft] = useState<string | null>(null);
  const [chartRight, setChartRight] = useState<string | null>(null);
  const [chartRefAreaLeft, setChartRefAreaLeft] = useState<string>('');
  const [chartRefAreaRight, setChartRefAreaRight] = useState<string>('');
  const [chartDisplayData, setChartDisplayData] = useState<ChartData[]>([]);
  const [chartTimeRange, setChartTimeRange] = useState<[number, number]>([0, 100]);
  
  const toast = useToast();

  function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleInvestmentChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    const numericValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    
    setPeriodicInvestment(numericValue);
  };

  const formatInvestmentInput = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString();
  };

  const fetchCoinPrices = async (coinId: string, startDate: string, endDate: string) => {
    try {
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${coinId}&interval=1d&startTime=${startTimestamp}&endTime=${endTimestamp}`
      );

      if (!response.ok) {
        throw new Error('가격 데이터를 가져오는데 실패했습니다');
      }

      const data = await response.json();
      
      const usdToKrw = 1300;

      return data.map((candle: any[]) => ({
        date: new Date(candle[0]).toISOString().split('T')[0],
        price: parseFloat(candle[4]) * usdToKrw,
      }));
    } catch (error) {
      console.error(`Error fetching ${coinId} prices:`, error);
      throw new Error(`${selectedCoin.name} 가격 데이터를 가져오는데 실패했습니다`);
    }
  };

  const calculateDCA = async () => {
    if (periodicInvestment <= 0) {
      toast({
        title: '입력 오류',
        description: '올바른 투자 금액을 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: '날짜 오류',
        description: '시작 날짜는 종료 날짜보다 이전이어야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const prices = await fetchCoinPrices(selectedCoin.id, startDate, endDate);
      
      if (prices.length === 0) {
        toast({
          title: '데이터 없음',
          description: '선택한 기간에 가격 데이터가 없습니다. 다른 기간을 선택해주세요.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }
      
      // 시작 날짜와 종료 날짜 사이의 모든 날짜를 생성
      const allDates: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        allDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 모든 날짜에 대한 가격 데이터 매핑 (없는 날짜는 이전 날짜의 가격 사용)
      const priceMap: Record<string, number> = {};
      let lastPrice = 0;
      
      prices.forEach(price => {
        priceMap[price.date] = price.price;
        lastPrice = price.price;
      });
      
      // 빠진 날짜에 대해 이전 가격 사용
      allDates.forEach(date => {
        if (!priceMap[date] && lastPrice > 0) {
          priceMap[date] = lastPrice;
        } else if (priceMap[date]) {
          lastPrice = priceMap[date];
        }
      });
      
      let totalInvestment = 0;
      let totalCoins = 0;
      let investmentDates: string[] = [];
      let newChartData: ChartData[] = [];
      
      // 투자 주기에 따라 투자 날짜 계산
      let investDate = new Date(startDate);
      const calculateNextDate = PERIOD_CONFIGS[investmentPeriod].calculateNextDate || 
        ((date: Date) => {
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + customDays);
          return nextDate;
        });
      
      while (investDate <= endDateObj) {
        const dateStr = investDate.toISOString().split('T')[0];
        
        if (priceMap[dateStr]) {
          totalInvestment += periodicInvestment;
          totalCoins += periodicInvestment / priceMap[dateStr];
          investmentDates.push(dateStr);
          
          newChartData.push({
            date: dateStr,
            portfolioValue: totalCoins * priceMap[dateStr],
            coinPrice: priceMap[dateStr],
            investedAmount: totalInvestment,
            coinAmount: totalCoins,
          });
        }
        
        // 다음 투자 날짜 계산
        investDate = calculateNextDate(investDate);
      }
      
      // 투자 날짜 사이의 날짜에 대한 차트 데이터 추가 (투자는 없지만 가격 변동 반영)
      const fullChartData: ChartData[] = [];
      let lastInvestment = 0;
      let lastCoins = 0;
      
      allDates.forEach(date => {
        const investmentData = newChartData.find(d => d.date === date);
        
        if (investmentData) {
          fullChartData.push(investmentData);
          lastInvestment = investmentData.investedAmount;
          lastCoins = investmentData.coinAmount;
        } else if (priceMap[date]) {
          // 투자가 없는 날에는 이전 투자 상태 유지하고 가격만 반영
          fullChartData.push({
            date: date,
            portfolioValue: lastCoins * priceMap[date],
            coinPrice: priceMap[date],
            investedAmount: lastInvestment,
            coinAmount: lastCoins,
          });
        }
      });
      
      // 날짜순으로 정렬
      fullChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (fullChartData.length === 0) {
        toast({
          title: '데이터 없음',
          description: '선택한 기간에 투자 데이터가 없습니다. 다른 기간을 선택해주세요.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      const currentPrice = priceMap[endDate] || prices[prices.length - 1].price;
      const currentValue = totalCoins * currentPrice;
      const totalProfit = currentValue - totalInvestment;
      const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

      setChartData(fullChartData);
      setResult({
        totalInvestment,
        currentValue,
        totalProfit,
        profitPercentage,
        totalCoins,
        investmentCount: investmentDates.length,
        averagePrice: totalCoins > 0 ? totalInvestment / totalCoins : 0,
        currentPrice,
        startPrice: priceMap[startDate] || prices[0].price,
      });

    } catch (error) {
      console.error('Error calculating DCA:', error);
      toast({
        title: '오류 발생',
        description: '데이터를 가져오는데 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = () => {
    if (investmentPeriod === 'custom') {
      return `${customDays}일마다`;
    }
    return PERIOD_CONFIGS[investmentPeriod].label;
  };

  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card>
          <CardBody p={3}>
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">{label}</Text>
              <Text>보유 자산 가치: {formatKRW(payload[0].value)}</Text>
              <Text>총 투자 금액: {formatKRW(payload[1].value)}</Text>
              <Text>{selectedCoin.name} 가격: {formatKRW(payload[2].value)}</Text>
              <Text>보유 {selectedCoin.symbol}: {payload[3]?.value.toFixed(8)} {selectedCoin.symbol}</Text>
            </VStack>
          </CardBody>
        </Card>
      );
    }
    return null;
  };

  // 차트 데이터가 변경될 때마다 표시 데이터 업데이트
  useEffect(() => {
    if (chartData.length > 0) {
      setChartDisplayData(chartData);
      setChartLeft(null);
      setChartRight(null);
      setChartTimeRange([0, 100]);
    }
  }, [chartData]);

  // 시간 범위 슬라이더 변경 시 차트 데이터 업데이트
  useEffect(() => {
    if (chartData.length > 0) {
      const startIndex = Math.floor(chartData.length * (chartTimeRange[0] / 100));
      const endIndex = Math.ceil(chartData.length * (chartTimeRange[1] / 100));
      setChartDisplayData(chartData.slice(startIndex, endIndex));
    }
  }, [chartTimeRange, chartData]);

  // 차트 확대/축소 관련 함수들
  const handleChartMouseDown = (e: any) => {
    if (!e) return;
    setChartRefAreaLeft(e.activeLabel);
  };

  const handleChartMouseMove = (e: any) => {
    if (!e) return;
    if (chartRefAreaLeft) setChartRefAreaRight(e.activeLabel);
  };

  const handleChartMouseUp = () => {
    if (chartRefAreaLeft && chartRefAreaRight) {
      // 왼쪽과 오른쪽이 반대로 선택된 경우 교환
      if (chartRefAreaLeft > chartRefAreaRight) {
        [setChartRefAreaLeft, setChartRefAreaRight].forEach((fn, i) => {
          fn([chartRefAreaRight, chartRefAreaLeft][i]);
        });
      }

      // 확대 영역이 너무 작은 경우 무시
      if (chartRefAreaRight === chartRefAreaLeft || chartRefAreaRight === '') {
        setChartRefAreaLeft('');
        setChartRefAreaRight('');
        return;
      }

      // 선택된 영역으로 차트 확대
      const refLeft = chartData.findIndex(item => item.date === chartRefAreaLeft);
      const refRight = chartData.findIndex(item => item.date === chartRefAreaRight);
      
      if (refLeft !== -1 && refRight !== -1) {
        const leftPercent = (refLeft / chartData.length) * 100;
        const rightPercent = (refRight / chartData.length) * 100;
        setChartTimeRange([leftPercent, rightPercent]);
      }

      setChartLeft(chartRefAreaLeft);
      setChartRight(chartRefAreaRight);
      setChartRefAreaLeft('');
      setChartRefAreaRight('');
    }
  };

  const handleChartZoomOut = () => {
    setChartLeft(null);
    setChartRight(null);
    setChartTimeRange([0, 100]);
    setChartDisplayData(chartData);
  };

  const handleChartZoomIn = () => {
    if (chartTimeRange[1] - chartTimeRange[0] <= 10) return; // 이미 충분히 확대됨
    
    const range = chartTimeRange[1] - chartTimeRange[0];
    const middle = (chartTimeRange[0] + chartTimeRange[1]) / 2;
    const newRange = range / 2;
    
    setChartTimeRange([
      Math.max(0, middle - newRange / 2),
      Math.min(100, middle + newRange / 2)
    ]);
  };

  const handleChartMoveLeft = () => {
    const range = chartTimeRange[1] - chartTimeRange[0];
    const moveAmount = range / 4;
    
    if (chartTimeRange[0] <= 0) return; // 이미 가장 왼쪽
    
    setChartTimeRange([
      Math.max(0, chartTimeRange[0] - moveAmount),
      Math.max(range, chartTimeRange[1] - moveAmount)
    ]);
  };

  const handleChartMoveRight = () => {
    const range = chartTimeRange[1] - chartTimeRange[0];
    const moveAmount = range / 4;
    
    if (chartTimeRange[1] >= 100) return; // 이미 가장 오른쪽
    
    setChartTimeRange([
      Math.min(100 - range, chartTimeRange[0] + moveAmount),
      Math.min(100, chartTimeRange[1] + moveAmount)
    ]);
  };

  return (
    <Container maxW="7xl" py={{ base: 6, md: 8 }}>
      <VStack spacing={{ base: 6, md: 8 }}>
        <Heading size={{ base: '2xl', md: 'xl' }} textAlign="center">암호화폐 DCA 계산기</Heading>
        
        <Card w="full">
          <CardBody p={{ base: 4, md: 5 }}>
            <Text fontSize="lg" fontWeight="medium" mb={4}>암호화폐 선택</Text>
            <SimpleGrid columns={{ base: 3, sm: 4, md: 7 }} spacing={3}>
              {COINS.map((coin) => (
                <Card 
                  key={coin.id}
                  variant="outline"
                  cursor="pointer"
                  bg={selectedCoin.id === coin.id ? 'blue.50' : 'white'}
                  borderColor={selectedCoin.id === coin.id ? 'blue.500' : 'gray.200'}
                  onClick={() => setSelectedCoin(coin)}
                  _hover={{ borderColor: 'blue.300' }}
                >
                  <CardBody p={3}>
                    <VStack spacing={2}>
                      <Image 
                        src={coin.icon} 
                        alt={coin.name} 
                        boxSize={{ base: '30px', md: '40px' }}
                        fallbackSrc="https://via.placeholder.com/40"
                      />
                      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" textAlign="center">
                        {coin.name}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 8 }} w="full">
          <Card>
            <CardBody p={{ base: 5, md: 6 }}>
              <VStack spacing={{ base: 6, md: 6 }}>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 5, md: 4 }} w="full">
                  <FormControl>
                    <FormLabel {...labelStyles}>시작 날짜</FormLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate}
                      {...inputStyles}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel {...labelStyles}>종료 날짜</FormLabel>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={getYesterdayDate()}
                      {...inputStyles}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel {...labelStyles}>투자 주기</FormLabel>
                    <Select
                      value={investmentPeriod}
                      onChange={(e) => setInvestmentPeriod(e.target.value as InvestmentPeriod)}
                      {...selectStyles}
                    >
                      {Object.entries(PERIOD_CONFIGS).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  {investmentPeriod === 'custom' && (
                    <FormControl>
                      <FormLabel {...labelStyles}>커스텀 주기 (일)</FormLabel>
                      <NumberInput
                        min={1}
                        value={customDays}
                        onChange={(_, value) => setCustomDays(value)}
                        {...inputStyles}
                      >
                        <NumberInputField {...inputStyles} />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel {...labelStyles}>{`${getPeriodLabel()} 투자금`}</FormLabel>
                    <InputGroup>
                      <InputLeftAddon 
                        children="₩" 
                        height={{ base: '56px', md: '48px' }}
                        fontSize={{ base: 'lg', md: 'md' }}
                      />
                      <Input
                        value={formatInvestmentInput(periodicInvestment)}
                        onChange={(e) => handleInvestmentChange(e.target.value)}
                        onFocus={handleFocus}
                        placeholder="주기별 투자금을 입력하세요"
                        {...inputStyles}
                      />
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>

                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  onClick={calculateDCA}
                  isLoading={isLoading}
                  loadingText="계산 중..."
                  height={{ base: '56px', md: '48px' }}
                  fontSize={{ base: 'lg', md: 'md' }}
                >
                  계산하기
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {result !== null && (
            <Stack spacing={6}>
              <Card>
                <CardBody p={{ base: 5, md: 6 }}>
                  <Stack spacing={{ base: 6, md: 6 }}>
                    <HStack>
                      <Image 
                        src={selectedCoin.icon} 
                        alt={selectedCoin.name} 
                        boxSize="30px"
                        mr={2}
                        fallbackSrc="https://via.placeholder.com/30"
                      />
                      <Heading size={{ base: 'lg', md: 'md' }}>{selectedCoin.name} 투자 결과</Heading>
                    </HStack>
                    
                    <Stat bg="blue.50" p={{ base: 5, md: 4 }} borderRadius="lg">
                      <StatLabel fontSize={{ base: 'md', md: 'sm' }}>
                        현재 보유 자산 가치
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          (보유 중인 {selectedCoin.name}의 현재 시장 가치)
                        </Text>
                      </StatLabel>
                      <StatNumber fontSize={{ base: '2xl', md: 'xl' }} color="blue.600">
                        {result.currentValue.toLocaleString()}원
                      </StatNumber>
                    </Stat>

                    <Stat bg="green.50" p={{ base: 5, md: 4 }} borderRadius="lg">
                      <StatLabel fontSize={{ base: 'md', md: 'sm' }}>
                        총 투자 금액
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          (지금까지 투자한 총 금액 - 총 {result.investmentCount}회 투자)
                        </Text>
                      </StatLabel>
                      <StatNumber fontSize={{ base: '2xl', md: 'xl' }} color="green.600">
                        {result.totalInvestment.toLocaleString()}원
                      </StatNumber>
                    </Stat>

                    <Stat bg="purple.50" p={{ base: 5, md: 4 }} borderRadius="lg">
                      <StatLabel fontSize={{ base: 'md', md: 'sm' }}>
                        총 수익금 (수익률)
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          (현재 자산 가치 - 총 투자 금액)
                        </Text>
                      </StatLabel>
                      <StatNumber fontSize={{ base: '2xl', md: 'xl' }} color="purple.600">
                        {result.totalProfit.toLocaleString()}원 ({result.profitPercentage.toFixed(2)}%)
                      </StatNumber>
                    </Stat>

                    <SimpleGrid columns={2} spacing={4}>
                      <Stat bg="gray.50" p={{ base: 4, md: 3 }} borderRadius="lg">
                        <StatLabel fontSize={{ base: 'sm', md: 'xs' }}>보유 {selectedCoin.symbol}</StatLabel>
                        <StatNumber fontSize={{ base: 'xl', md: 'lg' }} color="gray.600">
                          {result.totalCoins.toFixed(8)} {selectedCoin.symbol}
                        </StatNumber>
                      </Stat>

                      <Stat bg="gray.50" p={{ base: 4, md: 3 }} borderRadius="lg">
                        <StatLabel fontSize={{ base: 'sm', md: 'xs' }}>평균 매수가</StatLabel>
                        <StatNumber fontSize={{ base: 'xl', md: 'lg' }} color="gray.600">
                          {result.averagePrice.toLocaleString()}원
                        </StatNumber>
                      </Stat>

                      <Stat bg="gray.50" p={{ base: 4, md: 3 }} borderRadius="lg">
                        <StatLabel fontSize={{ base: 'sm', md: 'xs' }}>시작 가격</StatLabel>
                        <StatNumber fontSize={{ base: 'xl', md: 'lg' }} color="gray.600">
                          {result.startPrice.toLocaleString()}원
                        </StatNumber>
                      </Stat>

                      <Stat bg="gray.50" p={{ base: 4, md: 3 }} borderRadius="lg">
                        <StatLabel fontSize={{ base: 'sm', md: 'xs' }}>현재 가격</StatLabel>
                        <StatNumber fontSize={{ base: 'xl', md: 'lg' }} color="gray.600">
                          {result.currentPrice.toLocaleString()}원
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Stack>
                </CardBody>
              </Card>

              <Card>
                <CardBody p={{ base: 5, md: 6 }}>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md">투자 금액과 자산 가치 변화</Heading>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        시간에 따른 투자 금액, 보유 자산 가치, {selectedCoin.name} 가격, 보유 코인 개수의 변화를 보여줍니다.
                      </Text>
                    </Box>
                    
                    {/* 차트 컨트롤 버튼 */}
                    <Flex justifyContent="space-between" alignItems="center">
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <IconButton 
                          aria-label="이전 기간으로 이동" 
                          icon={<ChevronLeftIcon />} 
                          onClick={handleChartMoveLeft}
                        />
                        <IconButton 
                          aria-label="다음 기간으로 이동" 
                          icon={<ChevronRightIcon />} 
                          onClick={handleChartMoveRight}
                        />
                      </ButtonGroup>
                      
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <IconButton 
                          aria-label="확대" 
                          icon={<AddIcon />} 
                          onClick={handleChartZoomIn}
                        />
                        <IconButton 
                          aria-label="축소" 
                          icon={<MinusIcon />} 
                          onClick={handleChartZoomOut}
                        />
                        <IconButton 
                          aria-label="초기화" 
                          icon={<RepeatIcon />} 
                          onClick={handleChartZoomOut}
                        />
                      </ButtonGroup>
                    </Flex>
                    
                    {/* 차트 영역 */}
                    <Box h="400px">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartDisplayData}
                          onMouseDown={handleChartMouseDown}
                          onMouseMove={handleChartMouseMove}
                          onMouseUp={handleChartMouseUp}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                            allowDataOverflow
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                            allowDataOverflow
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${value.toFixed(4)}`}
                            allowDataOverflow
                            domain={['auto', 'auto']}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="portfolioValue" 
                            stroke="#4299E1" 
                            name="보유 자산 가치"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            yAxisId="left"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="investedAmount" 
                            stroke="#48BB78" 
                            name="총 투자 금액"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            yAxisId="left"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="coinPrice" 
                            stroke="#805AD5" 
                            name={`${selectedCoin.name} 가격`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            yAxisId="left"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="coinAmount" 
                            stroke="#DD6B20" 
                            name={`보유 ${selectedCoin.symbol} 개수`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            yAxisId="right"
                          />
                          {chartRefAreaLeft && chartRefAreaRight ? (
                            <ReferenceArea
                              x1={chartRefAreaLeft}
                              x2={chartRefAreaRight}
                              strokeOpacity={0.3}
                              fill="#8884d8"
                              fillOpacity={0.3}
                            />
                          ) : null}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                    
                    {/* 시간 범위 슬라이더 */}
                    <Box px={2} pt={2}>
                      <RangeSlider
                        aria-label={['시작 시간', '종료 시간']}
                        value={chartTimeRange}
                        onChange={(val: number[]) => setChartTimeRange([val[0], val[1]] as [number, number])}
                        min={0}
                        max={100}
                        step={1}
                      >
                        <RangeSliderTrack bg="blue.100">
                          <RangeSliderFilledTrack bg="blue.500" />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} boxSize={4} />
                        <RangeSliderThumb index={1} boxSize={4} />
                      </RangeSlider>
                      <Flex justify="space-between" mt={1}>
                        <Text fontSize="xs" color="gray.500">
                          {chartData.length > 0 ? chartData[0].date : ''}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {chartData.length > 0 ? chartData[chartData.length - 1].date : ''}
                        </Text>
                      </Flex>
                    </Box>
                    
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      차트에서 영역을 드래그하여 확대하거나, 버튼을 사용하여 확대/축소 및 이동할 수 있습니다.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </Stack>
          )}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}