import {
  Table,
  Header,
  SpaceBetween,
  Button,
  Pagination,
} from "@cloudscape-design/components";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  DocumentItem,
  DocumentResult,
  RagDocumentType,
  ResultValue,
} from "../../../common/types";
import RouterButton from "../../../components/wrappers/router-button";
import { TableEmptyState } from "../../../components/table-empty-state";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { getColumnDefinition } from "./columns";

export interface DocumentsTabProps {
  workspaceId?: string;
  documentType: RagDocumentType;
}

export default function DocumentsTab(props: DocumentsTabProps) {
  const appContext = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pages, setPages] = useState<DocumentResult[]>([]);

  const getDocuments = useCallback(
    async (params: { lastDocumentId?: string; pageIndex?: number }) => {
      if (!appContext) return;
      if (!props.workspaceId) return;

      setLoading(true);

      const apiClient = new ApiClient(appContext);
      const result =
        props.documentType != "rss"
          ? await apiClient.documents.getDocuments(
              props.workspaceId,
              props.documentType,
              params?.lastDocumentId
            )
          : await apiClient.rss.getRssFeedSubscriptions(props.workspaceId);

      if (ResultValue.ok(result)) {
        setPages((current) => {
          const foundIndex = current.findIndex(
            (c) => c.lastDocumentId === result.data.lastDocumentId
          );

          if (foundIndex !== -1) {
            current[foundIndex] = result.data;
            return [...current];
          } else if (typeof params.pageIndex !== "undefined") {
            current[params.pageIndex - 1] = result.data;
            return [...current];
          } else if (result.data.items.length === 0) {
            return current;
          } else {
            return [...current, result.data];
          }
        });
      }

      setLoading(false);
    },
    [appContext, props.documentType, props.workspaceId]
  );

  const deleteRssSubscription = useCallback(
    async (params: { workspaceId: string; documentTitle: string }) => {
      if (!appContext) return;
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.rss.deleteRssFeedSubscription(
        params.workspaceId,
        params.documentTitle
      );
      if (ResultValue.ok(result)) {
        getDocuments({});
      }
    },
    [appContext, getDocuments]
  );

  useEffect(() => {
    getDocuments({});
  }, [getDocuments]);

  const onNextPageClick = async () => {
    const lastDocumentId = pages[currentPageIndex - 1]?.lastDocumentId;

    if (lastDocumentId) {
      if (pages.length <= currentPageIndex) {
        await getDocuments({ lastDocumentId });
      }

      setCurrentPageIndex((current) => Math.min(pages.length + 1, current + 1));
    }
  };

  const onPreviousPageClick = async () => {
    setCurrentPageIndex((current) =>
      Math.max(1, Math.min(pages.length - 1, current - 1))
    );
  };

  const refreshPage = async () => {
    if (currentPageIndex <= 1) {
      await getDocuments({ pageIndex: currentPageIndex });
    } else {
      const lastDocumentId = pages[currentPageIndex - 2]?.lastDocumentId;
      await getDocuments({ lastDocumentId });
    }
  };

  const typeStr = ragDocumentTypeToString(props.documentType);
  const typeAddStr = ragDocumentTypeToAddString(props.documentType);
  const typeTitleStr = ragDocumentTypeToTitleString(props.documentType);
  const columnDefinitions = getColumnDefinition(props.documentType);
  if (props.documentType == "rss") {
    let x = 0;
    for (const columnDefinition of columnDefinitions) {
      if (columnDefinition.id == "deleteButton") {
        columnDefinitions[x].cell = (item: DocumentItem) => {
          return (
            <>
              <Button
                variant="link"
                onClick={() => {
                  if (item.title && props.workspaceId) {
                    deleteRssSubscription({
                      documentTitle: item.title,
                      workspaceId: props.workspaceId,
                    });
                  }
                }}
              >
                Delete
              </Button>
            </>
          );
        };
      }
      x = x++;
    }
  }
  return (
    <Table
      loading={loading}
      loadingText={`Loading ${typeStr}s`}
      columnDefinitions={columnDefinitions}
      items={pages[Math.min(pages.length - 1, currentPageIndex - 1)]?.items}
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={refreshPage} />
              <RouterButton
                href={`/rag/workspaces/add-data?workspaceId=${props.workspaceId}&tab=${props.documentType}`}
              >
                {typeAddStr}
              </RouterButton>
            </SpaceBetween>
          }
          description={ragDocumentTypeDescription(props.documentType)}
        >
          {typeTitleStr}
        </Header>
      }
      empty={
        <TableEmptyState
          resourceName={typeStr}
          createHref={`/rag/workspaces/add-data?workspaceId=${props.workspaceId}&tab=${props.documentType}`}
          createText={typeAddStr}
        />
      }
      pagination={
        pages.length === 0 ? null : (
          <Pagination
            openEnd={true}
            pagesCount={0}
            currentPageIndex={currentPageIndex}
            onNextPageClick={onNextPageClick}
            onPreviousPageClick={onPreviousPageClick}
          />
        )
      }
    />
  );
}

function ragDocumentTypeDescription(type: RagDocumentType) {
  switch (type) {
    case "rss":
      return 'Existing RSS feed subscriptions are listed below. To remove a subscription, click "Delete". RSS Feeds are refreshed daily. Any new posts found will show under the websites tab after they are crawled.';
    default:
      return "Please expect a delay for your changes to be reflected. Press the refresh button to see the latest changes.";
  }
}

function ragDocumentTypeToString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "File";
    case "text":
      return "Text";
    case "qna":
      return "Q&A";
    case "website":
      return "Website";
    case "rss":
      return "RSS Feed";
  }
}

function ragDocumentTypeToTitleString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "Files";
    case "text":
      return "Texts";
    case "qna":
      return "Q&As";
    case "website":
      return "Websites";
    case "rss":
      return "RSS Feeds";
  }
}

function ragDocumentTypeToAddString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "Upload files";
    case "text":
      return "Add texts";
    case "qna":
      return "Add Q&A";
    case "website":
      return "Crawl website";
    case "rss":
      return "Subcribe to RSS Feed";
  }
}
