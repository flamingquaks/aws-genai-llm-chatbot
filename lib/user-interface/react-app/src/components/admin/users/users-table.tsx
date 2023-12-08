import {
  Button,
  ButtonDropdown,
  ButtonDropdownProps,
  Header,
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [adminAction, setAdminAction] = useState<AdminUsersManagementAction>(
    AdminUsersManagementAction.NO_ACTION
  );

  const getUsers = useCallback(async () => {
    if (!appContext) return;
    if (!userContext || userContext.userRole != UserRole.ADMIN) {
      navigate("/");
    }

    const apiClient = new ApiClient(appContext);
    const result = await apiClient.adminUsers.getUsers();
    console.debug("result = ", result);
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
      console.debug("result = ", result);
      if (ResultValue.ok(result)) {
        getUsers();
      }
    },
    [getUsers, appContext, userContext]
  );

  const updateUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.updateUser(userData);
      console.debug("result = ", result);
      if (ResultValue.ok(result)) {
        getUsers();
      }
    },
    [getUsers, appContext, userContext]
  );

  const disableUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.disableUser(userData);
      console.debug("result = ", result);
      if (ResultValue.ok(result)) {
        getUsers();
      }
    }, [appContext, userContext, getUsers]
  )

  const enableUser = useCallback(
    async (userData: UserData) => {
      if (!appContext) return;
      if (!userContext || userContext.userRole != UserRole.ADMIN) return;
      setLoading(true)
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.adminUsers.enableUser(userData);
      console.debug("result = ", result);
      if (ResultValue.ok(result)) {
        getUsers();
      }
      setLoading(false)
    }, [appContext, userContext, getUsers, setLoading]
  )

  const onDismiss = async () => {
    setAdminAction(AdminUsersManagementAction.NO_ACTION);
    setIsModalVisible(false);
  };

  const onSave = async (userData: UserData) => {
    setIsModalVisible(false);
    if (adminAction === AdminUsersManagementAction.CREATE) {
      createUser(userData);
    } else if (adminAction === AdminUsersManagementAction.EDIT) {
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
    if (detail.id == "edit") {
      setIsModalVisible(true);
      setAdminAction(AdminUsersManagementAction.EDIT);
    } else if (detail.id == "disable") {
      setAdminAction(AdminUsersManagementAction.DISABLE);
      if (currentlySelectedUser) {
        disableUser(currentlySelectedUser)
      }
    } else if (detail.id == "delete") {
      setAdminAction(AdminUsersManagementAction.DELETE);
      if (currentlySelectedUser) {
        enableUser(currentlySelectedUser)
      }
    }
    setAdminAction(AdminUsersManagementAction.NO_ACTION)
  };

  const handleAddUserClick = () => {
    setSelectedUsers([]);
    setCurrentlySelectedUser(undefined);
    setIsModalVisible(true);
    setAdminAction(AdminUsersManagementAction.CREATE);
  };

  const onUserSelectionChange = (
    detail: TableProps.SelectionChangeDetail<UserData>
  ) => {
    setSelectedUsers(detail.selectedItems);
    setCurrentlySelectedUser(detail.selectedItems[0]);
  };

  const columnDefinitions = getUserTableColumns();

  return (
    <>
      <ManageUserModal
        key={currentlySelectedUser?.email ? currentlySelectedUser?.email : null}
        onDismiss={onDismiss}
        visible={isModalVisible}
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
                      disabled: selectedUsers.length != 1,
                    },
                    {
                      id: "delete",
                      text: "Delete User",
                      iconName: "delete-marker",
                      disabled: selectedUsers.length != 1,
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
