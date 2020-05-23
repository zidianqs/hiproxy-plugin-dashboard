/**
 * @file Table component
 * @author zdying
 */

import React from 'react';
import Modal from '../../../components/Modal';
import SimpleEditor from '../../../components/Editor';
import './styles.less';

function reorder(list) {
  const trueList = [];
  const falseList = [];
  Object.keys(list).forEach(key => {
    if(list[key].enable) {
      trueList.push(key);
    } else {
      falseList.push(key);
    }
  });
  return trueList.concat(falseList);
}

export default class extends React.Component {
  constructor (props, state) {
    super(props, state);
    let files = this.props.files;
    this.state = {
      files: files,
      isAllSelected: this.getDefaultStatus(files)
    };

    this.btns = [];
    this.btnsLength = 0;
    this.onModalClose = this.onModalClose.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.switchAllStatus = this.switchAllStatus.bind(this);
    this.switchStatus = this.switchStatus.bind(this);
    this.getRefs = this.getRefs.bind(this);
    this.checkAllSwitch = this.checkAllSwitch.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      files: nextProps.files
    })
  }

  renderTableRow(fileKey, file) {
    let { fileType, port } = this.props;

    const {result , enable} = file;
    const domains = Object.keys(result || {});
    const isChecked = enable ? 'checked':'';

    return (
      <tr className="" key={fileKey}>
        <td className="color-blue">{fileKey}</td>
        <td className="status-switch">
          <label className="form-switch">
            <input type="checkbox" onClick={this.switchStatus.bind(this, fileKey, enable, port, fileType)} checked={isChecked} ref={this.getRefs}/>
            <i className="form-icon"></i>
          </label>
        </td>
        <td>
          {
            domains.length > 0 ?
              <div className="popover popover-left">
                {domains.length} Domains
                <div className="popover-container">
                  <div className="card">
                    <ul className="card-body">
                      {domains.map((item) => {
                        return <li>{item}</li>
                      })}
                    </ul>
                  </div>
                </div>
              </div> : <div>{domains.length} Domains</div>
          }

        </td>
        <td>{fileType}</td>
        <td>
          <button className="btn" onClick={this.editFile.bind(this, file, fileType, true)}>View</button>
          <button className="btn" onClick={this.editFile.bind(this, file, fileType, false)}>Edit</button>
        </td>
      </tr>
    );
  }

  render () {
    let files = this.state.files;

    return (
      <div>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>File Path</th>
              <th>
                State
                <label className="form-switch form-switch-all">
                  <input type="checkbox" checked={this.state.isAllSelected} onClick={this.switchAllStatus}/>
                  <i className="form-icon"></i>
                </label>
              </th>
              <th>Domain Count</th>
              <th>Config Type</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            {
              reorder(files)
                .map((fileKey) => this.renderTableRow(fileKey, files[fileKey]))
            }
          </tbody>
        </table>
        {this.renderDialog()}
      </div>
    )
  }

  getDefaultStatus(obj) {
    return Object.entries(obj).every((item)=>{
      return item[1].enable === true;
    })
  }

  getRefs(ele) {
    this.btns[this.btnsLength++] = ele;
  }

  switchAllStatus() {
    let state = this.state;
    this.btns.forEach((ele) => {
    if (!state.isAllSelected) { // 点击前为未选中状态
      if (!ele.checked) {
        ele.click();
      }
    } else {
      if (ele.checked) {
        ele.click();
      }
    }

    });
    this.setState({
      isAllSelected: !this.state.isAllSelected
    })
  }

  checkAllSwitch(arr) {
    // 判断当前files对象，是否是全部都为enable或者存在一个不是enable
    // 因此，该函数只应该在enable配置文件时调用以检测
    let bool = arr.filter((item) => {
      return item[1].enable === true;
    }).length - arr.length >= -1;
    return this.state.isAllSelected || bool;
  }


  switchStatus(file, enable, port, type) {

    const files = this.state.files;
    const actionType = !enable ? 'enableFile':'disableFile';
    const me = this;
    const fileType = {fileType: type, filePath: file};
    let isAllSelected = true;
    if ('disableFile' === actionType) {
      isAllSelected = false;
    } else {
      let bool = !this.checkAllSwitch(Object.entries(files));
      if (bool) {
        isAllSelected = false;
      }
    }
    files[file].enable = !enable;

    fetch('/api?action='+actionType +'&params='+JSON.stringify(fileType)).then(function (res) {
      me.setState({
        files,
        isAllSelected
      });
    }).catch(function (err) {
      console.log(err);
    });

    return false;
  }



  renderDialog() {
    let {fileInfo, fileType, disabled} = this.state;

    if (fileInfo) {
      let {status, message, data} = fileInfo;

      if (status === 0) {
        return (
          <Modal title={`Edit ${fileType} file`} btnHandler={this.saveFile.bind(this, fileType)} onClose={this.onModalClose} btnText="Save" showOKBtn={!disabled}>
            <div style={{width: '720px', height: '50vh', overflow: 'auto'}}>
              <SimpleEditor ref={o => this.editor = o} value={data.content || ''} disabled={disabled} />
            </div>
          </Modal>
        )
      } else {
        return null;
      }
    }
  }

  editFile(file, fileType, disabled) {
    fetch('/dashboard/api/readFile?file=' + file + '&type=' + fileType)
    .then(res => {
      return res.json();
    })
    .then(json => {
      this.setState({
        fileType,
        fileInfo: json,
        disabled: disabled
      })
    })
    .catch(err => {
      this.setState({
        fileInfo: err
      })
    });
  }

  onModalClose(){
    this.setState({
      fileInfo: null
    })
  }

  saveFile(fileType, file){
    let content = this.editor.editor.value;
    fetch('/dashboard/api/saveFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: this.state.fileInfo.data.file,
        content: content,
        type: fileType
      })
    })
    .then(json => {
      this.setState({
        fileInfo: null
      });
      setTimeout(()=>{
        location.reload();// 刷新页面，获取最新的配置
      } , 1000);
    })
    .catch(err => {
      this.setState({
        fileInfo: err
      })
    })
  }
}