import {
  Alert,
  Button,
  ButtonDropdown,
  ButtonDropdownProps,
  Header,
  Modal,
  SpaceBetween,
  Table,
  TableProps,
} from "@cloudscape-design/components";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  AdminUsersManagementAction,
  ResultValue,
  UserData,
  UserRole,
} from "../../../common/types";
import { ApiClient } from "../../../common/api-client/api-client";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../common/app-context";
import { UserContext } from "../../../common/user-context";
import { getUserTableColumns } from "./users-table-columns";
import ManageUserModal from "./manage-user-modal";

export default function UsersTable() {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const userContext = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [currentlySelectedUser, setCurrentlySelectedUser] =
    useState<UserData>();
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [adminAction, setAdminAction] = useState<AdminUsersManagementAction>(
    AdminUsersManagementAction.NO_ACTION
  );
  const [userEnabled, setUserEnabled] = useState(true);

  const getUsers = useCallback(async () => {
    if (!appContext) return;
    if (!userContext || userContext.userRole != UserRole.ADMIN) {
      navigate("/");
    }

    const apiClient = new ApiClient(appContext);
    const result = await apiClient.adminUsers.getUsers();
    if (ResultValue.ok(result)) {
      setUsers([...result.data]);
    }
    setLoading(false);
  }, [appContext, userContext, setLoading, navigate]);

  const createUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.createUser(userData);
      if (ResultValue.ok(result)) {
        getUsers();
      }
      setLoading(false);
    },
    [getUsers, appContext, userContext]
  );

  const updateUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.updateUser(
        userData.name,
        userData.email,
        userData.phoneNumber ?? "",
        userData.role,
        userData.previousEmail
      );
      if (ResultValue.ok(result)) {
        getUsers();
      }
      setCurrentlySelectedUser(undefined);
      setSelectedUsers([]);
      setLoading(false);
    },
    [getUsers, appContext, userContext, setLoading]
  );

  const disableUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.disableUser(userData);
      if (ResultValue.ok(result)) {
        getUsers();
      }
      setLoading(false);
    },
    [appContext, userContext, getUsers, setLoading]
  );

  const enableUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      setLoading(true);
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.enableUser(userData);
      if (ResultValue.ok(result)) {
        getUsers();
      }
      setLoading(false);
    },
    [appContext, userContext, getUsers, setLoading]
  );

  const onDismiss = async () => {
    setAdminAction(AdminUsersManagementAction.NO_ACTION);
    setCurrentlySelectedUser(undefined);
    setSelectedUsers([]);
    setIsManageModalVisible(false);
    setIsConfirmModalVisible(false);
  };

  const onSave = async (userData: UserData) => {
    console.debug(adminAction);
    setIsManageModalVisible(false);
    setLoading(true);
    if (adminAction == AdminUsersManagementAction.CREATE) {
      createUser(userData);
    } else if (adminAction == AdminUsersManagementAction.EDIT) {
      updateUser(userData);
    }
  };

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const refreshUsers = async () => {
    setLoading(true);
    await getUsers();
  };

  const handleUserActions = (
    event: CustomEvent<ButtonDropdownProps.ItemClickDetails>
  ) => {
    const detail = event.detail;
    if (detail.id == "edit" && currentlySelectedUser) {
      console.debug(AdminUsersManagementAction);
      setAdminAction(AdminUsersManagementAction.EDIT);
      setIsManageModalVisible(true);
    } else if (detail.id == "disable" && currentlySelectedUser) {
      setAdminAction(AdminUsersManagementAction.DISABLE);
      setIsConfirmModalVisible(true);
    } else if (detail.id == "enable" && currentlySelectedUser) {
      setAdminAction(AdminUsersManagementAction.ENABLE);
      enableUser(currentlySelectedUser);
      setCurrentlySelectedUser(undefined);
      setSelectedUsers([]);
    } else if (detail.id == "delete" && currentlySelectedUser) {
      setAdminAction(AdminUsersManagementAction.DELETE);
      setIsConfirmModalVisible(true);
    } else {
      setAdminAction(AdminUsersManagementAction.NO_ACTION);
    }
  };

  const handleAddUserClick = () => {
    setSelectedUsers([]);
    setCurrentlySelectedUser(undefined);
    setIsManageModalVisible(true);
    setAdminAction(AdminUsersManagementAction.CREATE);
  };

  const onUserSelectionChange = (
    detail: TableProps.SelectionChangeDetail<UserData>
  ) => {
    setSelectedUsers(detail.selectedItems);
    setCurrentlySelectedUser(detail.selectedItems[0]);
    if (detail.selectedItems[0].enabled) {
      setUserEnabled(true);
    } else {
      setUserEnabled(false);
    }
  };

  const columnDefinitions = getUserTableColumns();

  return (
    <>
      <Modal
        visible={isConfirmModalVisible}
        onDismiss={onDismiss}
        header={<Header>{getConfirmHeader(adminAction)}</Header>}
        footer={
          <SpaceBetween size="s" direction="horizontal" alignItems="end">
            <Button onClick={onDismiss}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (adminAction == AdminUsersManagementAction.DELETE) {
                  if (currentlySelectedUser) {
                    // deleteUser(currentlySelectedUser);
                    setCurrentlySelectedUser(undefined);
                    setSelectedUsers([]);
                    setIsConfirmModalVisible(false);
                    setAdminAction(AdminUsersManagementAction.NO_ACTION);
                    console.debug("DELETE USER CLICKED");
                  }
                } else if (adminAction == AdminUsersManagementAction.DISABLE) {
                  if (currentlySelectedUser) {
                    disableUser(currentlySelectedUser);
                    setCurrentlySelectedUser(undefined);
                    setSelectedUsers([]);
                    setIsConfirmModalVisible(false);
                    setAdminAction(AdminUsersManagementAction.NO_ACTION);
                  }
                }
              }}
            >
              {getConfirmActionButton(adminAction)}
            </Button>
          </SpaceBetween>
        }
      >
        <Alert type="warning">{getConfirmDescription(adminAction)}</Alert>
      </Modal>
      <ManageUserModal
        key={currentlySelectedUser?.email ? currentlySelectedUser?.email : null}
        onDismiss={onDismiss}
        visible={isManageModalVisible}
        userData={currentlySelectedUser}
        onSave={onSave}
        adminAction={adminAction}
      ></ManageUserModal>
      <Table
        loading={loading}
        columnDefinitions={columnDefinitions}
        loadingText="Loading Users"
        resizableColumns={true}
        selectedItems={selectedUsers}
        selectionType="single"
        onSelectionChange={({ detail }) => onUserSelectionChange(detail)}
        items={users}
        header={
          <Header
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button iconName="refresh" onClick={refreshUsers} />
                <Button variant="primary" onClick={handleAddUserClick}>
                  Add User
                </Button>
                <ButtonDropdown
                  onItemClick={(details) => handleUserActions(details)}
                  items={[
                    {
                      id: "edit",
                      text: "Edit User",
                      iconName: "edit",
                      disabled: selectedUsers.length != 1,
                    },
                    {
                      id: "disable",
                      text: "Disable User",
                      iconName: "close",
                      disabled: selectedUsers.length != 1 || !userEnabled,
                      description:
                        selectedUsers.length != 1 || !userEnabled
                          ? "User is already disabled"
                          : "Click to disable the selected user",
                    },
                    {
                      id: "enable",
                      text: "Enable User",
                      iconName: "check",
                      disabled: selectedUsers.length != 1 || userEnabled,
                      description:
                        selectedUsers.length != 1 || userEnabled
                          ? "User is already enabled"
                          : "Click to enable the selected user",
                    },
                    {
                      id: "delete",
                      text: "Delete User",
                      iconName: "delete-marker",
                      disabled: selectedUsers.length != 1 || userEnabled,
                      description:
                        selectedUsers.length != 1 || userEnabled
                          ? "Selected user is still enabled. Disable the user first to enable user deletion"
                          : "Click to delete the selected user. This deletes all data associate with the user as well.",
                    },
                  ]}
                >
                  Actions
                </ButtonDropdown>
              </SpaceBetween>
            }
          />
        }
      />
    </>
  );
}

const getConfirmHeader = (action: AdminUsersManagementAction): string => {
  switch (action) {
    case AdminUsersManagementAction.DISABLE:
      return "Disable User?";
    case AdminUsersManagementAction.DELETE:
      return "Delete User?";
    default:
      return "Confirm?";
  }
};

const getConfirmDescription = (action: AdminUsersManagementAction): string => {
  switch (action) {
    case AdminUsersManagementAction.DISABLE:
      return "Are you sure you want to disable this user? This user will no longer be able to login. The user can be enabled later and any user data will remain stored.";
    case AdminUsersManagementAction.DELETE:
      return "Are you sure you want to delete this user? This will delete all data associated with the user as well.";
    default:
      return "Are you sure?";
  }
};

const getConfirmActionButton = (action: AdminUsersManagementAction): string => {
  switch (action) {
    case AdminUsersManagementAction.DISABLE:
      return "Disable User";
    case AdminUsersManagementAction.DELETE:
      return "Delete User";
    default:
      return "Confirm";
  }
};
