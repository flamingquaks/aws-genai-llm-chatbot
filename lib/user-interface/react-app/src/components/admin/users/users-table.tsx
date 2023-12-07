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
import { ResultValue, UserData, UserRole } from "../../../common/types";
import { ApiClient } from "../../../common/api-client/api-client";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../common/app-context";
import { UserContext } from "../../../common/user-context";
import { getUserTableColumns } from "./users-table-columns";
import ManageUserModal from "./manage-user-modal";

export interface UsersTableProps { }

export default function UsersTable() {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const userContext = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [currentlySelectedUser, setCurrentlySelectedUser] = useState<UserData>();
  const [isModalVisible, setIsModalVisible] = useState(false)

  const getUsers = useCallback(async () => {
    if (!appContext) return;
    if (!userContext || userContext.userRole != UserRole.ADMIN) {
      console.debug(userContext.userRole);
      console.debug("KICKING YOU OUT!");
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

  const onDismiss = async () => {
    setIsModalVisible(false)
  }

  const onSave = async (userData: UserData) => {
    console.debug("SAVING", userData)
    setIsModalVisible(false)
  }

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const refreshUsers = async () => {
    setLoading(true);
    await getUsers();
  };



  const handleUserActions = (event: CustomEvent<ButtonDropdownProps.ItemClickDetails>) => {
    const detail = event.detail;
    if (detail.id == "edit") {
      setIsModalVisible(true)
    } else if (detail.id == "disable") {
      console.debug("DISABLE USER")
    } else if (detail.id == "delete") {
      console.debug("DELETE USER")
    }
  }

  const handleAddUserClick = () => {
    setSelectedUsers([])
    setIsModalVisible(true)
  }

  const onUserSelectionChange = (detail: TableProps.SelectionChangeDetail<UserData>) => {
    setSelectedUsers(detail.selectedItems)
    setCurrentlySelectedUser(detail.selectedItems[0])
  }


  const columnDefinitions = getUserTableColumns();

  return (
    <>
      <ManageUserModal
        key={currentlySelectedUser?.email}
        onDismiss={onDismiss}
        visible={isModalVisible}
        userData={currentlySelectedUser}
        onSave={onSave}
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
                <Button variant="primary" onClick={handleAddUserClick} >
                  Add User
                </Button>
                <ButtonDropdown
                  onItemClick={details => handleUserActions(details)}
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
