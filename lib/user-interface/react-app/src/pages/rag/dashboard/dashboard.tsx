import { ContentLayout, SpaceBetween } from "@cloudscape-design/components";
import { BreadcrumbGroup } from "@cloudscape-design/components";
import { useContext, useEffect, useState } from "react";
import { ResultValue, UserRole, WorkspaceItem } from "../../../common/types";
import { ApiClient } from "../../../common/api-client/api-client";
import { AppContext } from "../../../common/app-context";
import DashboardHeader from "./dashboard-header";
import WorkspacesTable from "./workspaces-table";
import useOnFollow from "../../../common/hooks/use-on-follow";
import BaseAppLayout from "../../../components/base-app-layout";
import GeneralConfig, { WorkspacesStatistics } from "./general-config";
import { CHATBOT_NAME } from "../../../common/constants";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../common/user-context";

export default function Dashboard() {
  const onFollow = useOnFollow();
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const userContext = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [statistics, setStatistics] = useState<WorkspacesStatistics | null>(
    null
  );

  useEffect(() => {
    if (
      ![
        UserRole.ADMIN,
        UserRole.WORKSPACES_MANAGER,
        UserRole.WORKSPACES_USER,
      ].includes(userContext.userRole)
    ) {
      navigate("/");
    }
  }, [userContext, navigate]);

  useEffect(() => {
    (async () => {
      if (!appContext) return;
      console.log("WorkspacesTable: useEffect");

      const apiClient = new ApiClient(appContext);
      const result = await apiClient.workspaces.getWorkspaces();
      if (ResultValue.ok(result)) {
        const data = result.data;
        setWorkspaces(data);
        console.log(data);
        setStatistics({
          count: data.length,
          documents: data.reduce((a, b) => a + b.documents, 0),
          vectors: data.reduce((a, b) => a + b.vectors, 0),
          sizeInBytes: data.reduce((a, b) => a + b.sizeInBytes, 0),
        });
      }

      setLoading(false);
    })();
  }, [appContext]);

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            {
              text: CHATBOT_NAME,
              href: "/",
            },
            {
              text: "RAG",
              href: "/rag",
            },
          ]}
          expandAriaLabel="Show path"
          ariaLabel="Breadcrumbs"
        />
      }
      content={
        <ContentLayout header={<DashboardHeader />}>
          <SpaceBetween size="l">
            <GeneralConfig statistics={statistics} />
            <WorkspacesTable loading={loading} workspaces={workspaces} />
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
