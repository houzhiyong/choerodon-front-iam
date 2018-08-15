import React, { Component } from 'react';
import { axios as authorizeAxios } from 'choerodon-front-boot';
import { Form, Modal, Button, Input } from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import querystring from 'query-string';
import APITestStore from '../../../stores/global/api-test';
import './APITest.scss';

const intlPrefix = 'global.apitest';
const FormItem = Form.Item;
const instance = authorizeAxios.create();
const getInfoinstance = authorizeAxios.create();

const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 9 },
  },
};

getInfoinstance.interceptors.request.use(
  (config) => {
    const newConfig = config;
    newConfig.headers['Content-Type'] = 'application/json';
    newConfig.headers.Accept = 'application/json';
    const accessToken = APITestStore.getApiToken;
    newConfig.headers.Authorization = accessToken;
    return newConfig;
  },
  (err) => {
    const error = err;
    return Promise.reject(error);
  });

instance.interceptors.response.use((res) => {
  APITestStore.setApiToken(`${res.data.token_type} ${res.data.access_token}`);
  APITestStore.setIsShowResult(null);
  getInfoinstance.get('iam/v1/users/self').then((info) => {
    APITestStore.setUserInfo(info.data.loginName);
  });
  Choerodon.prompt('授权成功');
  APITestStore.setIsShowModal(false);
  APITestStore.setModalSaving(false);
}, (error) => {
  Choerodon.prompt('授权失败');
  APITestStore.setModalSaving(false);
});

@Form.create({})
@injectIntl
@inject('AppState')
@observer
export default class AuthorizeModal extends Component {
  componentWillMount() {
    this.props.onRef(this);
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const password = this.encode(values.password);
        const queryObj = {
          username: values.account,
          password,
          client_id: 'client',
          grant_type: 'password',
          client_secret: 'secret',
        };
        APITestStore.setModalSaving(true);
        instance.post(`oauth/oauth/token?${querystring.stringify(queryObj)}`);
      }
    });
  }


  /**
   * 密码加密
   * @param password
   * @returns {string|string}
   */
  encode = (password) => {
    let output = '';
    let chr1;
    let chr2;
    let chr3 = '';
    let enc1;
    let enc2;
    let enc3;
    let enc4 = '';
    let i = 0;
    do {
      chr1 = password.charCodeAt(i += 1);
      chr2 = password.charCodeAt(i += 1);
      chr3 = password.charCodeAt(i += 1);
      enc1 = chr1 * 4;
      /* eslint-disable-next-line */
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      /* eslint-disable-next-line */
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      /* eslint-disable-next-line */
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc4 = 64;
        enc3 = enc4;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2)
        + keyStr.charAt(enc3) + keyStr.charAt(enc4);
      chr1 = '';
      chr2 = '';
      chr3 = '';
      enc1 = '';
      enc2 = '';
      enc3 = '';
      enc4 = '';
    } while (i < password.length);
    return output;
  };

  handleCancel = () => {
    APITestStore.setIsShowModal(false);
  }

  submitBtnRef = (node) => {
    if (node) {
      this.submitBtnRef = node;
    }
  }

  render() {
    const { intl, form } = this.props;
    const { getFieldDecorator } = form;
    const inputWidth = '370px';
    return (
      <div className="c7n-apitest-modal">
        <div className="c7n-apitest-modal-icon" />
        <div className="c7n-apitest-modal-title"><FormattedMessage id={`${intlPrefix}.authorize.title`} /></div>
        <Form layout="vertical" onSubmit={this.handleSubmit}>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('account', {
              rules: [{
                required: true,
                message: intl.formatMessage({ id: `${intlPrefix}.account.required` }),
              }],
            })(
              <Input label={intl.formatMessage({ id: `${intlPrefix}.authorize.account` })} style={{ width: inputWidth }} autoComplete="off" />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('password', {
              rules: [{
                required: true,
                message: intl.formatMessage({ id: `${intlPrefix}.pwd.required` }),
              }],
            })(
              <Input label={intl.formatMessage({ id: `${intlPrefix}.authorize.password` })} type="password" style={{ width: inputWidth }} autoComplete="off" />,
            )}
          </FormItem>
          <div className="c7n-apitest-modal-btn-group" >
            <Button funcType="flat" onClick={this.handleCancel} style={{ color: '#3F51B5' }} disabled={APITestStore.modalSaving}>取消授权</Button>
            <Button
              funcType="raised"
              type="primary"
              htmlType="submit"
              loading={APITestStore.modalSaving}
              ref={this.submitBtnRef}
            >
              <FormattedMessage id={`${intlPrefix}.authorize`} />
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
