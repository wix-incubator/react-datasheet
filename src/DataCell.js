import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
  ENTER_KEY,
  ESCAPE_KEY,
  TAB_KEY,
  RIGHT_KEY,
  LEFT_KEY,
  UP_KEY,
  DOWN_KEY,
} from './keys';

import Cell from './Cell';
import CellShape from './CellShape';

function widthStyle(cell) {
  const width = typeof cell.width === 'number' ? cell.width + 'px' : cell.width;
  return width ? { width } : null;
}

export default class DataCell extends PureComponent {
  constructor(props) {
    super(props);
    this.handleCommit = this.handleCommit.bind(this);
    this.handleRevert = this.handleRevert.bind(this);

    this.handleKey = this.handleKey.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.editing === true && prevProps.editing === false) {
      const { onClear, row, col, clearing, getCellContent } = this.props;
      clearing && onClear && onClear([{ i: row, j: col }]);
      this.initialContent = getCellContent && getCellContent(row, col);
    }
  }

  handleCommit(e) {
    const { onNavigate } = this.props;
    this.handleRevert();
    if (e) {
      e.preventDefault();
      onNavigate(e, true);
    }
  }

  handleRevert() {
    this.props.onRevert();
  }

  handleMouseDown(e) {
    const { row, col, onMouseDown, cell } = this.props;
    if (!cell.disableEvents) {
      onMouseDown(row, col, e);
    }
  }

  handleMouseOver(e) {
    const { row, col, onMouseOver, cell } = this.props;
    if (!cell.disableEvents) {
      onMouseOver(row, col);
    }
  }

  handleDoubleClick(e) {
    const { row, col, onDoubleClick, cell } = this.props;
    if (!cell.disableEvents) {
      onDoubleClick(row, col);
    }
  }

  handleContextMenu(e) {
    const { row, col, onContextMenu, cell } = this.props;
    if (!cell.disableEvents) {
      onContextMenu(e, row, col);
    }
  }

  handleKey(e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === ESCAPE_KEY) {
      const { setCellContent, row, col } = this.props;
      setCellContent && setCellContent(this.initialContent, row, col);
      return this.handleRevert();
    }
    const commit =
      keyCode === ENTER_KEY ||
      keyCode === TAB_KEY ||
      [LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY].includes(keyCode);

    if (commit) {
      this.handleCommit(e);
    }
  }

  renderComponent(editing, cell) {
    const { component, readOnly, forceComponent } = cell;
    if ((editing && !readOnly) || forceComponent) {
      return component;
    }
  }

  render() {
    const {
      row,
      col,
      cell,
      cellRenderer: CellRenderer,
      attributesRenderer,
      selected,
      editing,
      onKeyUp,
    } = this.props;

    const content = this.renderComponent(editing, cell);

    const className = [
      cell.className,
      'cell',
      cell.overflow,
      selected && 'selected',
      editing && 'editing',
      cell.readOnly && 'read-only',
    ]
      .filter(a => a)
      .join(' ');

    return (
      <CellRenderer
        row={row}
        col={col}
        cell={cell}
        selected={selected}
        editing={editing}
        attributesRenderer={attributesRenderer}
        className={className}
        style={widthStyle(cell)}
        onMouseDown={this.handleMouseDown}
        onMouseOver={this.handleMouseOver}
        onDoubleClick={this.handleDoubleClick}
        onContextMenu={this.handleContextMenu}
        onKeyUp={onKeyUp}
        onRevert={this.handleRevert}
        onKeyDown={this.handleKey}
      >
        {content}
      </CellRenderer>
    );
  }
}

DataCell.propTypes = {
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  cell: PropTypes.shape(CellShape).isRequired,
  forceEdit: PropTypes.bool,
  selected: PropTypes.bool,
  editing: PropTypes.bool,
  editValue: PropTypes.any,
  clearing: PropTypes.bool,
  cellRenderer: PropTypes.func,
  valueRenderer: PropTypes.func.isRequired,
  dataRenderer: PropTypes.func,
  valueViewer: PropTypes.func,
  dataEditor: PropTypes.func,
  attributesRenderer: PropTypes.func,
  onNavigate: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseOver: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRevert: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

DataCell.defaultProps = {
  forceEdit: false,
  selected: false,
  editing: false,
  clearing: false,
  cellRenderer: Cell,
};
