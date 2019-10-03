import React, {Component, Fragment} from 'react';

import PropTypes from 'prop-types';

import {_t} from '../../../i18n';

import CheckBox from '../../helper/checkbox';

import Tooltip from '../../helper/tooltip';

import Browser from './browser';

import ProjectSettingsDialog from '../../dialogs/project-settings'

import fs from '../../../fs';

import _c from '../../../utils/fix-class-names'

import {BASE_PATH, PATH_SEPARATOR} from '../../../constants';

import {refreshSvg, deleteSvg, settingsSvg, homeSvg, openSvg} from '../../../svg';

class Project extends Component {

  checked = (checked) => {
    const {files, path, checkListAdd, checkListReset} = this.props;
    const {map} = files;

    if (!checked || !map) {
      checkListReset();
      return;
    }

    const itemsToAdd = [...map[path]['folders'], ...map[path]['files'].map(x => x._id)];
    checkListAdd(itemsToAdd);
  };

  pathClicked = (path) => {
    const {selectPath} = this.props;
    selectPath(path);
  };

  refresh = () => {
    const {fetchFiles} = this.props;
    fetchFiles();
  };

  delete = () => {
    const {files, checkList, setDeleteQueue} = this.props;
    const {map, list} = files;
    let delList = [];

    checkList.forEach((i) => {
      if (fs.isPath(i)) {
        delList = [...delList, ...fs.getFilesUnderPath(map, i)];
      } else {
        delList = [...delList, list.find(x => x._id === i)];
      }
    });

    setDeleteQueue(delList);
  };

  showSettings = () => {
    const {toggleUiProp} = this.props;
    toggleUiProp('projectSettings');
  };

  render() {
    const {project, files, path, checkList, ui} = this.props;
    const {map, loading} = files;
    const pathArr = fs.pathToArr(path);

    let allChecked = false;
    let disabled = false;
    if (map) {
      const all = map[path]['folders'].length + map[path]['files'].length;
      allChecked = all > 0 && all === checkList.length;
      disabled = all === 0
    }

    const projectUrl = `https://${project.name}`;

    return (
      <div className="project">
        <div className="toolbar">
          <Tooltip title={_t('manager.project.select-all')}>
            <div className="select-input">
              <CheckBox checked={allChecked} disabled={disabled || loading} onChange={this.checked}/>
            </div>
          </Tooltip>
          {(() => {
            if (checkList.length === 0) {
              return (
                <>
                  <Tooltip title={_t('manager.project.refresh')}>
                    <div className={_c(`refresh-btn ${loading ? 'disabled' : ''}`)}>
                      <span className="inner-btn" onClick={this.refresh}>{refreshSvg}</span>
                    </div>
                  </Tooltip>
                  <Tooltip title={projectUrl}>
                    <div className="open-btn">
                      <a className="inner-btn" href={projectUrl} target="_blank"
                         rel="noopener noreferrer">{openSvg}</a>
                    </div>
                  </Tooltip>
                  {path !== '/' &&
                  <div className="full-path">

                    <Tooltip title={_t('manager.project.root-folder')}>
                      <div className="home-btn">
                        <span className="inner-btn" onClick={() => {
                          this.pathClicked(BASE_PATH)
                        }}>{homeSvg}</span>
                      </div>
                    </Tooltip>

                    {pathArr.map((p, i) => {
                        const path = fs.arrToPath(pathArr.slice(0, i + 1));
                        return (
                          <Fragment key={p}>
                            <span onClick={() => {
                              this.pathClicked(path)
                            }} className="path">{p}</span>
                            <span className="separator">{PATH_SEPARATOR}</span>
                          </Fragment>
                        )
                      }
                    )}
                  </div>
                  }
                  <div className="h-space"/>
                  <Tooltip title={_t('manager.project.settings')} dir="left">
                    <div className="settings-btn">
                      <span className="inner-btn" onClick={this.showSettings}>{settingsSvg}</span>
                    </div>
                  </Tooltip>
                </>
              )
            }

            if (checkList.length > 0) {
              let label = '';

              if (allChecked) {
                label = _t('manager.project.all-items-selected');
              } else {
                if (checkList.length === 1) {
                  label = _t('manager.project.item-selected');
                } else {
                  label = _t('manager.project.items-selected', {n: checkList.length});
                }
              }

              return (
                <div className="items-selected">
                  {allChecked &&
                  <span className="selected-label">{label}</span>
                  }
                  {!allChecked &&
                  <span className="selected-label">{label}</span>
                  }

                  <Tooltip title={_t('manager.project.delete')}>
                    <div className="delete-btn"><span className="inner-btn" onClick={this.delete}>{deleteSvg}</span>
                    </div>
                  </Tooltip>
                </div>
              )
            }
          })()}
        </div>
        <Browser {...this.props} />
        {ui.projectSettings && <ProjectSettingsDialog {...this.props} />}
      </div>
    )
  }
}

Project.defaultProps = {};

Project.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  files: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    map: PropTypes.shape({})
  }).isRequired,
  ui: PropTypes.shape({
    projectSettings: PropTypes.bool.isRequired
  }).isRequired,
  path: PropTypes.string.isRequired,
  checkList: PropTypes.array.isRequired,
  fetchFiles: PropTypes.func.isRequired,
  selectPath: PropTypes.func.isRequired,
  checkListAdd: PropTypes.func.isRequired,
  checkListReset: PropTypes.func.isRequired,
  setDeleteQueue: PropTypes.func.isRequired,
  toggleUiProp: PropTypes.func.isRequired,
};

export default Project;
