import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'choerodon-front-boot';
import { Button, Icon, Select, Spin } from 'choerodon-ui';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import './APIOverview.scss';
import APIOverviewStore from '../../../stores/global/api-overview';
import TimePicker from './TimePicker';

const { Option } = Select;
const intlPrefix = 'global.apioverview';

@withRouter
@injectIntl
@inject('AppState')
@observer
export default class APIOverview extends Component {
  state = this.getInitState();

  componentDidMount() {
    this.loadFirstChart();
    this.loadSecChart();
    APIOverviewStore.setThirdLoading(true);
    APIOverviewStore.loadServices().then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else if (data.length) {
        /* eslint-disable-next-line */
        const handledData = data.map(item => item = { name: item.name.split(':')[1] });
        APIOverviewStore.setService(handledData);
        APIOverviewStore.setCurrentService(handledData[0]);
        const startDate = APIOverviewStore.thirdStartTime.format().split('T')[0];
        const endDate = APIOverviewStore.thirdEndTime.format().split('T')[0];
        APIOverviewStore.loadThirdChart(startDate, endDate, handledData[0].name);
      }
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  }

  getInitState() {
    return {
      dateType: 'seven',
      thirdDateType: 'seven',
    };
  }

  handleRefresh = () => {
    APIOverviewStore.setThirdLoading(true);
    this.loadFirstChart();
    this.setState(this.getInitState(), () => {
      this.loadSecChart();
      APIOverviewStore.loadServices().then((data) => {
        if (data.failed) {
          Choerodon.prompt(data.message);
        } else if (data.length) {
          /* eslint-disable-next-line */
          const handledData = data.map(item => item = { name: item.name.split(':')[1] });
          APIOverviewStore.setService(handledData);
          APIOverviewStore.setCurrentService(handledData[0]);
          const startDate = APIOverviewStore.thirdStartTime.format().split('T')[0];
          const endDate = APIOverviewStore.thirdEndTime.format().split('T')[0];
          APIOverviewStore.loadThirdChart(startDate, endDate, handledData[0].name);
        }
      }).catch((error) => {
        Choerodon.handleResponseError(error);
      });
    });
  };


  handleDateChoose = (type) => {
    this.setState({ dateType: type });
  };

  handleThirdDateChoose = (type) => {
    this.setState({ thirdDateType: type });
  }

  loadFirstChart = () => {
    APIOverviewStore.setFirstLoading(true);
    APIOverviewStore.loadFirstChart();
  }

  loadSecChart = () => {
    APIOverviewStore.setSecLoading(true);
    const startDate = APIOverviewStore.getSecStartTime.format().split('T')[0];
    const endDate = APIOverviewStore.getSecEndTime.format().split('T')[0];
    APIOverviewStore.loadSecChart(startDate, endDate);
  };

  loadThirdChart = () => {
    APIOverviewStore.setThirdLoading(true);
    const currentService = APIOverviewStore.getCurrentService;
    const startDate = APIOverviewStore.getThirdStartTime.format().split('T')[0];
    const endDate = APIOverviewStore.getThirdEndTime.format().split('T')[0];
    APIOverviewStore.loadThirdChart(startDate, endDate, currentService.name);
  }


  getFirstChart = () => (
    <div className="c7n-iam-api-overview-top-container-first-container">
      {
          APIOverviewStore.firstLoading ? (
            <Spin spinning={APIOverviewStore.firstLoading} />
          ) : (
            <ReactEcharts
              style={{ width: '100%', height: 380 }}
              option={this.getFirstChartOption()}
            />
          )
        }
    </div>
  )

  getSecChart = () => {
    const { dateType } = this.state;
    return (
      <div className="c7n-iam-api-overview-top-container-sec-container">
        <Spin spinning={APIOverviewStore.secLoading}>
          <div className="c7n-iam-api-overview-top-container-sec-container-timewrapper">
            <TimePicker
              showDatePicker={false}
              startTime={APIOverviewStore.getSecStartTime}
              endTime={APIOverviewStore.getSecEndTime}
              func={this.loadSecChart}
              type={dateType}
              onChange={this.handleDateChoose}
              store={APIOverviewStore}
              sort={2}
            />
          </div>
          <ReactEcharts
            style={{ width: '100%', height: 380 }}
            option={this.getSecChartOption()}
            notMerge
          />
        </Spin>
      </div>
    );
  }

  getThirdChart = () => {
    const { thirdDateType } = this.state;
    return (
      <div className="c7n-iam-api-overview-third-container">
        <Spin spinning={APIOverviewStore.thirdLoaidng}>
          <div className="c7n-iam-api-overview-third-container-timewrapper">
            <Select
              style={{ width: '140px', marginRight: '34px', overflow: 'hidden' }}
              value={APIOverviewStore.currentService.name}
              getPopupContainer={() => document.getElementsByClassName('page-content')[0]}
              onChange={this.handleChange.bind(this)}
              label="所属微服务"
              // filterOption={(input, option) =>
              //   option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              // filter
            >
              {this.getOptionList()}
            </Select>
            <TimePicker
              showDatePicker
              startTime={APIOverviewStore.getThirdStartTime}
              endTime={APIOverviewStore.getThirdEndTime}
              func={this.loadThirdChart}
              type={thirdDateType}
              onChange={this.handleThirdDateChoose}
              store={APIOverviewStore}
              sort={3}
            />
          </div>
          <ReactEcharts
            style={{ width: '98%', height: 400 }}
            option={this.getThirdChartOption()}
            notMerge
          />
        </Spin>
      </div>
    );
  }

  /* 微服务下拉框 */
  getOptionList() {
    const service = APIOverviewStore.getService;
    return service && service.length > 0 ? (
      service.map(({ name }, index) => (
        <Option key={index} value={name}>{name}</Option>
      ))
    ) : <Option value="empty">无服务</Option>;
  }

  /**
   * 微服务下拉框改变事件
   * @param serviceName 服务名称
   */
  handleChange(serviceName) {
    const currentService = APIOverviewStore.service.find(service => service.name === serviceName);
    APIOverviewStore.setCurrentService(currentService);
    this.loadThirdChart();
  }

  // 获取第一个图表的配置参数
  getFirstChartOption() {
    const { firstChartData } = APIOverviewStore;
    let handledFirstChartData;
    if (firstChartData) {
      /* eslint-disable-next-line */
      handledFirstChartData = firstChartData.services.map((item, index) => item = { name: item, value: firstChartData.apiCounts[index] });
    }
    return {
      title: {
        text: '各服务API总数',
        textStyle: {
          color: 'rgba(0,0,0,0.87)',
          fontWeight: '400',
        },
        top: 20,
        left: 16,
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b} <br/>百分比: {d}% <br/>总数: {c}',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDDDDD',
        extraCssText: 'box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20)',
        textStyle: {
          fontSize: 13,
          color: '#000000',
        },
      },
      legend: {
        right: 15,
        y: 'center',
        type: 'plain',
        data: firstChartData ? firstChartData.services : [],
        orient: 'vertical', // 图例纵向排列
        icon: 'circle',
      },
      // calculable: true,
      series: [
        {
          type: 'pie',
          radius: [20, 110],
          center: ['31%', '50%'],
          roseType: 'radius',
          minAngle: 30,
          label: {
            normal: {
              show: false,
            },
          },
          data: handledFirstChartData || {},
        },
      ],
      color: ['#FDB34E', '#5266D4', '#FD717C', '#53B9FC', '#F44336', '#6B83FC', '#B5D7FD', '#00BFA5'],
    };
  }

  // 获取第二个图表的配置参数
  getSecChartOption() {
    const secChartData = APIOverviewStore.getSecChartData;
    const { intl: { formatMessage } } = this.props;
    let handleSeriesData = [];
    if (secChartData) {
      handleSeriesData = secChartData.details.map(item => ({
        type: 'line',
        name: item.service,
        data: item.data,
        smooth: 0.5,
        smoothMonotone: 'x',
        symbol: 'circle',
        areaStyle: {
          opacity: '0.5',
        },
      }));
    }
    return {
      title: {
        text: '各服务API调用总数',
        textStyle: {
          color: 'rgba(0,0,0,0.87)',
          fontWeight: '400',
        },
        top: 20,
        left: 16,
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
        },
      },
      legend: {
        top: 60,
        right: 16,
        type: 'plain',
        orient: 'vertical', // 图例纵向排列
        icon: 'circle',
        data: secChartData ? secChartData.services : [],
      },
      grid: {
        left: '3%',
        top: 110,
        containLabel: true,
        width: '65%',
        height: '55%',
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: {
            lineStyle: {
              color: '#eee',
              type: 'solid',
              width: 2,
            },
            onZero: true,
          },
          axisLabel: {
            margin: 7, // X轴文字和坐标线之间的间距
            textStyle: {
              color: 'rgba(0, 0, 0, 0.65)',
              fontSize: 12,
            },
            formatter(value) {
              const month = value.split('-')[1];
              const day = value.split('-')[2];
              return `${month}/${day}`;
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
              width: 1,
              type: 'solid',
            },
          },
          data: secChartData ? secChartData.date : [],
        },
      ],
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
          name: '次数',
          nameLocation: 'end',
          nameTextStyle: {
            color: '#000',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#eee',
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
            },
          },
          axisLabel: {
            color: 'rgba(0,0,0,0.65)',
          },
        },
      ],
      series: handleSeriesData,
      color: ['#FDB34E', '#5266D4', '#FD717C', '#53B9FC', '#F44336', '#6B83FC', '#B5D7FD', '#00BFA5'],
    };
  }

  // 获取第三个图表的配置参数
  getThirdChartOption() {
    const thirdChartData = APIOverviewStore.getThirdChartData;
    let handledData = [];
    if (thirdChartData) {
      handledData = thirdChartData.details.map(item => ({
        type: 'line',
        // name: `${item.api.split(':')[1]}:  ${item.api.split(':')[0]}`,
        name: item.api,
        data: item.data,
        smooth: 0.2,
        lineStyle: {
          shadowOffsetX: 6,
          shadowOffsetY: 2,
          opacity: 0.5,
        },
      }));
    }

    // let handleSeriesThirdData = [];
    // // if (thirdChartData) {
    //   if (thirdChartData.details.length) {
    //     handleSeriesThirdData = thirdChartData.details.map(item => ({
    //       type: 'line',
    //       name: `${item.api.split(':')[1]}:  ${item.api.split(':')[0]}`,
    //       data: item.data,
    //       smooth: 0.2,
    //       lineStyle: {
    //         shadowOffsetX: 6,
    //         shadowOffsetY: 2,
    //         opacity: 0.5,
    //       },
    //     }));
    //   } else {
    //     handleSeriesThirdData.length = 0;
    //   }
    // }
    return {
      title: {
        text: '各API调用总数',
        textStyle: {
          color: 'rgba(0,0,0,0.87)',
          fontWeight: '400',
        },
        top: 20,
        left: 16,
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
        },
      },
      legend: {
        type: 'scroll',
        show: false,
        width: '10%',
        top: 60,
        right: '5%',
        orient: 'vertical', // 图例纵向排列
        icon: 'circle',
        // textStyle: {
        //   width: '20',
        // },
        data: thirdChartData ? thirdChartData.apis : [],
        formatter(name) {
          if (name.length > 5) {
            const a = name.substring(0, 19);
            const b = name.substring(17);
            return `${a}
${b}`;
          } else {
            return name;
          }
        },
        // formatter(value) {
        //   return `${value.split(':')[1]}:${value.split(':')[0]}`;
        // },
      },
      grid: {
        left: '3%',
        top: 110,
        containLabel: true,
        width: '92%',
        height: '62.5%',
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: {
            lineStyle: {
              color: '#eee',
              type: 'solid',
              width: 2,
            },
            onZero: true,
          },
          axisLabel: {
            margin: 7, // X轴文字和坐标线之间的间距
            textStyle: {
              color: 'rgba(0, 0, 0, 0.65)',
              fontSize: 12,
            },
            formatter(value) {
              const month = value.split('-')[1];
              const day = value.split('-')[2];
              return `${month}/${day}`;
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
              width: 1,
              type: 'solid',
            },
          },
          data: thirdChartData ? thirdChartData.date : [],
        },
      ],
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
          name: '次数',
          nameLocation: 'end',
          nameTextStyle: {
            color: '#000',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#eee',
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
            },
          },
          axisLabel: {
            color: 'rgba(0,0,0,0.65)',
          },
        },
      ],
      series: handledData,
      color: ['#FDB34E', '#5266D4', '#FD717C', '#53B9FC', '#F44336', '#6B83FC', '#B5D7FD', '#00BFA5'],
    };
  }


  render() {
    return (
      <Page
        service={[
          'manager-service.api.queryInstancesAndApiCount',
          'manager-service.api.queryApiInvoke',
          'manager-service.api.queryServiceInvoke',
        ]}
      >
        <Header
          title={<FormattedMessage id={`${intlPrefix}.header.title`} />}
        >
          <Button
            onClick={this.handleRefresh}
            icon="refresh"
          >
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content>
          <div className="c7n-iam-api-overview-top-container">
            {this.getFirstChart()}
            {this.getSecChart()}
          </div>
          {this.getThirdChart()}
        </Content>
      </Page>
    );
  }
}
