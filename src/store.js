/**
 * @file
 * @author zdying
 */

import { createStore } from 'redux';

import reducer from './reducer';

let store = createStore(
  reducer,
  {},
  // 使用Redux-devtool必须要加入下面这一行代码
  window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : undefined
);

export default store;
