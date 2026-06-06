import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Scale,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { useStore } from '../../store/useStore';
import {
  caseTrend,
  departmentStats,
  causeStats,
  appealHeatmap,
} from '../../data/mockData';
import { formatDate } from '../../utils/format';
import { cn } from '../../lib/utils';

const Dashboard: React.FC = () => {
  const { statsData, refreshStats, cases } = useStore();
  const [selectedCause, setSelectedCause] = useState('all');
  const [selectedJudge, setSelectedJudge] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayStats, setDisplayStats] = useState(statsData);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshStats();
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshStats]);

  useEffect(() => {
    setDisplayStats(statsData);
  }, [statsData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const statCards = [
    {
      title: '收案总数',
      value: displayStats.totalCases,
      today: displayStats.todayNewCases,
      icon: FileText,
      trend: '+12.5%',
      trendUp: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: '结案总数',
      value: displayStats.closedCases,
      today: displayStats.todayClosedCases,
      icon: CheckCircle,
      trend: '+8.3%',
      trendUp: true,
      color: 'from-green-500 to-green-600',
    },
    {
      title: '未结案件',
      value: displayStats.pendingCases,
      subtext: '需关注',
      icon: Clock,
      trend: '-5.2%',
      trendUp: false,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: '平均审理天数',
      value: displayStats.avgTrialDays,
      unit: '天',
      icon: Activity,
      trend: '-3.1天',
      trendUp: false,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: '执行到位率',
      value: displayStats.executionRate,
      unit: '%',
      icon: Scale,
      trend: '+2.4%',
      trendUp: true,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: '上诉率',
      value: displayStats.appealRate,
      unit: '%',
      icon: AlertTriangle,
      trend: '-1.2%',
      trendUp: false,
      color: 'from-red-500 to-rose-500',
    },
  ];

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['新收案件', '结案案件'],
      textStyle: { color: '#9ca3af' },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: caseTrend.map(item => item.date),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af' },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [
      {
        name: '新收案件',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: caseTrend.map(item => item.newCases),
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
      },
      {
        name: '结案案件',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: caseTrend.map(item => item.closedCases),
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ],
          },
        },
      },
    ],
  };

  const departmentOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['收案数', '结案数'],
      textStyle: { color: '#9ca3af' },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: departmentStats.map(d => d.departmentName.replace('审判', '').replace('庭', '')),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', rotate: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af' },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [
      {
        name: '收案数',
        type: 'bar',
        data: departmentStats.map(d => d.totalCases),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
      },
      {
        name: '结案数',
        type: 'bar',
        data: departmentStats.map(d => d.closedCases),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
      },
    ],
  };

  const causeOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c}件 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#9ca3af' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#111827',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
          },
        },
        labelLine: { show: false },
        data: causeStats.map((c, i) => ({
          value: c.count,
          name: c.cause,
          itemStyle: {
            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'][i],
          },
        })),
      },
    ],
  };

  const heatmapOption = {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        return `${params.data[1]} - ${params.data[0]}<br/>上诉率: ${params.data[2].toFixed(1)}%`;
      },
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '10%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: appealHeatmap.filter((_, i) => i % 6 === 0).map(d => d.month),
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'category',
      data: [...new Set(appealHeatmap.map(d => d.department))],
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af' },
    },
    visualMap: {
      min: 5,
      max: 20,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: { color: '#9ca3af' },
      inRange: {
        color: ['#1e3a5f', '#3b82f6', '#fbbf24', '#ef4444'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: appealHeatmap.map(d => [d.month, d.department, d.rate]),
        label: {
          show: true,
          color: '#fff',
          fontSize: 10,
          formatter: (params: any) => `${params.data[2].toFixed(1)}%`,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        radius: '90%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#ef4444' },
              { offset: 0.5, color: '#fbbf24' },
              { offset: 1, color: '#10b981' },
            ],
          },
        },
        progress: {
          show: true,
          width: 20,
        },
        pointer: { show: false },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, '#1f2937']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          offsetCenter: [0, '30%'],
          fontSize: 14,
          color: '#9ca3af',
        },
        detail: {
          valueAnimation: true,
          fontSize: 36,
          fontWeight: 'bold',
          offsetCenter: [0, '-10%'],
          formatter: '{value}%',
          color: '#10b981',
        },
        data: [{ value: displayStats.executionRate, name: '执行到位率' }],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            审判质效数据大屏
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            实时更新 · 最后更新: {formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: 'week', label: '本周' },
              { value: 'month', label: '本月' },
              { value: 'quarter', label: '本季度' },
              { value: 'year', label: '本年' },
            ]}
            className="w-32"
          />
          <Select
            value={selectedCause}
            onChange={(e) => setSelectedCause(e.target.value)}
            options={[
              { value: 'all', label: '全部案由' },
              { value: 'civil', label: '民事案件' },
              { value: 'criminal', label: '刑事案件' },
              { value: 'administrative', label: '行政案件' },
            ]}
            className="w-36"
          />
          <Select
            value={selectedJudge}
            onChange={(e) => setSelectedJudge(e.target.value)}
            options={[
              { value: 'all', label: '全部法官' },
              { value: '5', label: '陈法官' },
              { value: '6', label: '刘法官' },
              { value: '7', label: '赵法官' },
            ]}
            className="w-36"
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">刷新数据</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} hover bordered={false} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 big-number animate-count-up">
                      {card.value.toLocaleString()}
                      {card.unit && <span className="text-lg ml-1 font-normal">{card.unit}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {card.today !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          今日 +{card.today}
                        </span>
                      )}
                      {card.subtext && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {card.subtext}
                        </span>
                      )}
                      <span className={cn(
                        'inline-flex items-center text-xs font-medium',
                        card.trendUp ? 'text-green-500' : 'text-red-500'
                      )}>
                        {card.trendUp ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {card.trend}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    card.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                收结案趋势
              </h3>
            </div>
            <div className="h-72">
              <ReactECharts
                option={trendOption}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
              />
            </div>
          </CardContent>
        </Card>

        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                各庭室收结案对比
              </h3>
            </div>
            <div className="h-72">
              <ReactECharts
                option={departmentOption}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary-500" />
                案由分布
              </h3>
            </div>
            <div className="h-64">
              <ReactECharts
                option={causeOption}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
              />
            </div>
          </CardContent>
        </Card>

        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                上诉率热力图
              </h3>
            </div>
            <div className="h-64">
              <ReactECharts
                option={heatmapOption}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
              />
            </div>
          </CardContent>
        </Card>

        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-500" />
                执行到位率
              </h3>
            </div>
            <div className="h-64">
              <ReactECharts
                option={gaugeOption}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card bordered={false}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              审限预警案件
            </h3>
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">案号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">案由</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">承办人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">立案日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">审限到期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">剩余天数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">状态</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 5).map((caseItem) => {
                  const remaining = Math.ceil((new Date(caseItem.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isWarning = remaining <= 15;
                  return (
                    <tr key={caseItem.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                        {caseItem.caseNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {caseItem.causeOfAction}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {caseItem.judgeName || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {caseItem.createdAt}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {caseItem.deadline}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                          isWarning
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        )}>
                          {isWarning && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {remaining}天
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          审理中
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
