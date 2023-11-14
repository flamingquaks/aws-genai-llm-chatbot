import {
  Box,
  BreadcrumbGroup,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
  StatusIndicator,
  Table,
} from "@cloudscape-design/components";
import useOnFollow from "../../../common/hooks/use-on-follow";
import BaseAppLayout from "../../../components/base-app-layout";
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  DocumentItem,
  DocumentResult,
  ResultValue,
  WorkspaceItem,
} from "../../../common/types";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { CHATBOT_NAME, Labels } from "../../../common/constants";

export default function RssFeed() {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const onFollow = useOnFollow();
  const { workspaceId, feedId } = useParams();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceItem | null>(null);
  const [rssSubscription, setRssSubscription] = useState<DocumentItem | null>(
    null
  );
  const [rssSubscriptionPosts, setRssSubscriptionPosts] =
    useState<DocumentResult>({ items: [] });

  const getWorkspace = useCallback(async () => {
    if (!appContext || !workspaceId || !feedId) return;

    const apiClient = new ApiClient(appContext);
    const workspaceResult =
      await apiClient.workspaces.getWorkspace(workspaceId);
    const rssSubscriptionResult = await apiClient.rss.getRssSubscriptionDetails(
      workspaceId,
      feedId
    );
    const rssSubscriptionPosts = await apiClient.rss.getRssSubscriptionPosts(
      workspaceId,
      feedId
    );

    if (
      ResultValue.ok(workspaceResult) &&
      ResultValue.ok(rssSubscriptionResult)
    ) {
      if (!workspaceResult.data || !rssSubscriptionResult.data) {
        navigate("/rag/workspaces");
        return;
      }
      if (ResultValue.ok(rssSubscriptionPosts)) {
        setRssSubscriptionPosts(rssSubscriptionPosts.data);
      }

      setRssSubscription(rssSubscriptionResult.data);
      setWorkspace(workspaceResult.data);
      setLoading(false);
    }
  }, [appContext, navigate, workspaceId, feedId]);

  useEffect(() => {
    getWorkspace();
  }, [getWorkspace]);

  return (
    <BaseAppLayout
      contentType="cards"
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
            {
              text: "Workspaces",
              href: "/rag/workspaces",
            },
            {
              text: workspace?.name || "",
              href: `/rag/workspaces/${workspace?.id}`,
            },
            {
              text: rssSubscription?.title || "",
              href: `/rag/workspaces/${workspace?.id}/rss/${rssSubscription?.id}`,
            },
          ]}
        />
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              actions={<Button>Toggle RSS Feed Subscription</Button>}
            >
              {loading ? (
                <StatusIndicator type="loading">Loading...</StatusIndicator>
              ) : (
                workspace?.name
              )}
            </Header>
          }
        >
          <SpaceBetween size="l">
            <Container
              header={
                <Header variant="h2">RSS Feed Subscription Details</Header>
              }
            >
              <ColumnLayout columns={2} variant="text-grid">
                <SpaceBetween size="l">
                  <div>
                    <Box variant="awsui-key-label">RSS Subscription ID</Box>
                    <div>{rssSubscription?.id}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">RSS Feed Title</Box>
                    <div>{rssSubscription?.title}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">RSS Feed URL</Box>
                    <div>{rssSubscription?.path}</div>
                  </div>
                </SpaceBetween>
              </ColumnLayout>
              <SpaceBetween size="l">
                <div>
                  <Box variant="awsui-key-label">RSS Subscription Status</Box>
                  <div>{rssSubscription?.status}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">RSS Feed Last Checked</Box>
                  <div>Detail Coming Soon!</div>
                </div>
              </SpaceBetween>
            </Container>
            <Table
              loading={loading}
              loadingText={`Loading RSS Subscription Posts`}
              columnDefinitions={[
                {
                  id: "title",
                  header: "Title",
                  cell: (item: DocumentItem) => item.title,
                  isRowHeader: true,
                },
                {
                  id: "url",
                  header: "URL",
                  cell: (item: DocumentItem) => item.path,
                  isRowHeader: true,
                },
                {
                  id: "status",
                  header: "Status",
                  cell: (item: DocumentItem) => (
                    <StatusIndicator type={Labels.statusTypeMap[item.status]}>
                      {Labels.statusMap[item.status]}
                    </StatusIndicator>
                  ),
                },
              ]}
              items={rssSubscriptionPosts?.items}
              header={
                <Header
                  actions={
                    <SpaceBetween direction="horizontal" size="xs">
                      {/* <Button iconName="refresh" onClick={refreshPage} /> */}
                      {/* <RouterButton
                        href={`/rag/workspaces/add-data?workspaceId=${props.workspaceId}&tab=${props.documentType}`}
                      >
                        {typeAddStr}
                      </RouterButton> */}
                    </SpaceBetween>
                  }
                  description="See what posts have been crawled from the RSS feed."
                ></Header>
              }
            />
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
