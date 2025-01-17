import * as React from 'react';
import {
  Theme,
  Paper,
  Typography,
  InputBase,
  Menu,
  MenuItem,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { PushPin, Search } from '@mui/icons-material';
import { makeStyles, createStyles } from '@mui/styles';
import * as WorkspaceTypes from '@main/workspaces/common/workspace';
import { timeDifference } from '../../utils/timeUtils';
import {
  setWorkspaceConfigItem,
  removeWorkspaceHistoryItem,
} from '../../utils/ipc/workspaceIpcUtils';

const useStyles = makeStyles<Theme>((theme) =>
  createStyles({
    searchBarContainer: {
      padding: 5,
      height: '55px',
    },
    searchBarPaper: {
      height: '45px',
      flexDirection: 'row',
      display: 'flex',
      padding: '5px 5px 5px 0',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.palette.primary.main,
    },
    searchBarTitle: {
      display: 'inline-block',
      paddingLeft: 15,
      lineHeight: '45px',
      color: theme.palette.primary.contrastText,
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '250px',
      padding: 5,
      height: '28px',
      marginRight: '7px',
    },
    contentContainer: {
      maxHeight: '560px',
      overflowY: 'auto',
      marginLeft: '5px',
      marginRight: '8px',
      borderRadius: '5px',
      padding: 8,
    },
    workspaceItemWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      display: 'flex',
      height: '50px',
      cursor: 'pointer',
      borderRadius: '5px',
      padding: '5px 10px',
      '&:hover': {
        backgroundColor: '#e2e7f9',
      },
    },
    contextMenuItem: {
      '&:focus-visible': {
        backgroundColor: '#e2e7f9',
      },
    },
  })
);

const WorkspacesSearchBar: React.FC<WorkspacesSearchBarProps> = ({
  handleChange,
}) => {
  const classes = useStyles();
  return (
    <div className={classes.searchBarContainer}>
      <Paper className={classes.searchBarPaper} elevation={6}>
        <Typography variant="h5" className={classes.searchBarTitle}>
          최근 프로젝트
        </Typography>
        <Paper className={classes.inputWrapper}>
          <InputBase
            id="searchbar-input"
            style={{ height: '26px', width: '230px', marginLeft: '10px' }}
            onChange={handleChange}
          />
          <Search style={{ fontSize: '21px', color: 'grey' }} />
        </Paper>
      </Paper>
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  handleClose,
  contextMenuArgs,
  setHasToRefresh,
}) => {
  const classes = useStyles();
  const { isPinned, workspaceUid, folderUri } = contextMenuArgs;

  const togglePin = () => {
    if (workspaceUid) {
      setWorkspaceConfigItem({
        workspaceUid,
        key: 'isPinned',
        data: !isPinned,
      })
        .then((res: WorkspaceTypes.WorkspaceResponse) => {
          const { status } = res;
          if (status === WorkspaceTypes.WorkspaceStatusType.SUCCESS) {
            setHasToRefresh(true);
            handleClose();
          }
          return res;
        })
        .catch((e: any) => {
          console.log(e);
        });
    }
  };

  const removeItemFromList = () => {
    if (workspaceUid) {
      removeWorkspaceHistoryItem({ folderUri })
        .then((res: WorkspaceTypes.WorkspaceResponse) => {
          const { status } = res;
          if (status === WorkspaceTypes.WorkspaceStatusType.SUCCESS) {
            setHasToRefresh(true);
            handleClose();
          }
          return res;
        })
        .catch((e: any) => {
          console.log(e);
        });
    }
  };

  return (
    <Menu
      id="item-context-menu"
      open={contextMenu !== null}
      onClose={handleClose}
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      anchorReference="anchorPosition"
      MenuListProps={{
        'aria-labelledby': 'basic-button',
      }}
    >
      <MenuItem onClick={togglePin} className={classes.contextMenuItem}>
        {isPinned ? '목록에서 고정 해제' : '목록에 고정'}
      </MenuItem>
      <MenuItem onClick={removeItemFromList}>목록에서 삭제</MenuItem>
    </Menu>
  );
};

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  labelTitle,
  labelUri,
  workspaceUid,
  folderUri,
  lastOpenedTime,
  isPinned,
  handleContextMenu,
  dispatch,
  openWorkspace,
}) => {
  const classes = useStyles();
  const timestamp = timeDifference(
    Math.floor(+new Date() / 1000),
    lastOpenedTime
  );

  const handleMenuOpen = (e: React.MouseEvent) => {
    handleContextMenu(e, { isPinned, workspaceUid, folderUri });
  };

  return (
    <div
      role="button"
      className={classes.workspaceItemWrapper}
      onClick={() => {
        openWorkspace(folderUri);
      }}
      onContextMenu={handleMenuOpen}
    >
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h5">{labelTitle}</Typography>
        <Typography variant="h6" style={{ color: 'grey' }}>
          {labelUri}
        </Typography>
      </div>
      <div
        style={{
          display: 'inline-flex',
          fontSize: 15,
          lineHeight: '30px',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">{timestamp}</Typography>
        {isPinned ? (
          <PushPin
            style={{
              fontSize: '18px',
              color: '#da6767',
              marginLeft: '3px',
              transform: 'rotate(45deg)',
            }}
          />
        ) : (
          <div style={{ width: '20px' }} />
        )}
      </div>
    </div>
  );
};

const WorkspacesListContent: React.FC<WorkspacesListContentProps> = ({
  items,
  setHasToRefresh,
  openWorkspace,
}) => {
  const classes = useStyles();
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const dispatch = useDispatch();

  const [contextMenuArgs, setContextMenuArgs] = React.useState<ContextMenuArgs>(
    { isPinned: false, workspaceUid: '', folderUri: '' }
  );

  const handleContextMenu = (
    event: React.MouseEvent,
    args: ContextMenuArgs
  ) => {
    setContextMenuArgs(args);
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const workspaceList = items?.map((item) => {
    return (
      <WorkspaceItem
        key={item.workspaceUid}
        handleContextMenu={handleContextMenu}
        openWorkspace={openWorkspace}
        dispatch={dispatch}
        {...item}
      />
    );
  });
  return (
    <div className={classes.contentContainer}>
      {workspaceList}
      <ContextMenu
        contextMenu={contextMenu}
        handleClose={handleContextMenuClose}
        contextMenuArgs={contextMenuArgs}
        setHasToRefresh={setHasToRefresh}
      />
    </div>
  );
};

const doFilter = (
  items: WorkspaceTypes.RecentWorkspaceData[],
  filterValue: string
) =>
  items?.filter(
    (item) => item.labelTitle?.toUpperCase().indexOf(filterValue) > -1
  );

const WorkspacesList: React.FC<WorkspacesListProps> = ({
  items,
  setHasToRefresh,
  openWorkspace,
}) => {
  const [filteredItems, setFilteredItems] = React.useState(items);
  const handleInputChange = (e: any) => {
    const inputValue = e.target.value.toUpperCase();
    const filteredResult = doFilter(items, inputValue);
    setFilteredItems(filteredResult);
  };

  React.useEffect(() => {
    const inputEl = document.getElementById('searchbar-input');
    const inputValue = (inputEl as HTMLInputElement)?.value;
    if (inputEl && inputValue) {
      const filterResult = doFilter(items, inputValue.toUpperCase());
      setFilteredItems(filterResult);
    } else {
      setFilteredItems(items);
    }
  }, [items]);

  return (
    <>
      <WorkspacesSearchBar handleChange={handleInputChange} />
      <WorkspacesListContent
        items={filteredItems}
        setHasToRefresh={setHasToRefresh}
        openWorkspace={openWorkspace}
      />
    </>
  );
};

type WorkspacesListContentProps = {
  items: WorkspaceTypes.RecentWorkspaceData[];
  setHasToRefresh: any;
  openWorkspace: any;
};

type WorkspacesListProps = {
  items: WorkspaceTypes.RecentWorkspaceData[];
  setHasToRefresh: any;
  openWorkspace: any;
};

type WorkspaceItemProps = {
  handleContextMenu: any;
  dispatch: any;
  openWorkspace: any;
} & WorkspaceTypes.RecentWorkspaceData;

type ContextMenuProps = {
  contextMenu: any;
  handleClose: any;
  contextMenuArgs: ContextMenuArgs;
  setHasToRefresh: any;
};

type ContextMenuArgs = {
  isPinned: boolean;
  workspaceUid: string;
  folderUri: string;
};

type WorkspacesSearchBarProps = {
  handleChange: any;
};
export default WorkspacesList;
