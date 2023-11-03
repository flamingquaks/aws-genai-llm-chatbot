import {
  Button,
  Container,
  Flashbar,
  FlashbarProps,
  Form,
  FormField,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { AddDataData } from "./types";
import { useForm } from "../../../common/hooks/use-form";
import { useContext, useState } from "react";
import { AppContext } from "../../../common/app-context";
import { useNavigate } from "react-router-dom";
import { Utils } from "../../../common/utils";
import { ResultValue, WorkspaceItem } from "../../../common/types";
import { ApiClient } from "../../../common/api-client/api-client";

export interface AddRssSubscriptionProps {
  data: AddDataData;
  validate: () => boolean;
  selectedWorkspace?: WorkspaceItem;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
}

interface AddRssSubscriptionData {
  websiteUrl: string;
  feedTitle: string;
}

export default function AddRssSubscription(props: AddRssSubscriptionProps) {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [flashbarItem, setFlashbarItem] =
    useState<FlashbarProps.MessageDefinition | null>(null);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const { data, onChange, errors, validate } = useForm<AddRssSubscriptionData>({
    initialValue: () => {
      return {
        websiteUrl: "",
        feedTitle: "",
      };
    },
    validate: (form) => {
      const errors: Record<string, string | string[]> = {};

      if (form.websiteUrl.length === 0) {
        errors.websiteUrl = "Website address is required";
      } else if (Utils.isValidURL(form.websiteUrl) === false) {
        errors.websiteUrl = "Website address is not valid.";
      }

      return errors;
    },
  });

  const onSubmit = async () => {
    if (!appContext) return;
    let validationResult = validate();
    validationResult = props.validate() && validationResult;
    if (!validationResult) return;
    if (!props.data.workspace?.value) return;

    props.setSubmitting(true);
    setFlashbarItem(null);
    setGlobalError(undefined);

    const apiClient = new ApiClient(appContext);
    const result = await apiClient.rss.addRssFeedSubscription(
      props.data.workspace.value,
      data.websiteUrl,
      data.feedTitle
    );

    if (ResultValue.ok(result)) {
      setFlashbarItem({
        type: "success",
        content: "RSS Feed subscribed successfully",
        dismissible: true,
        onDismiss: () => setFlashbarItem(null),
        buttonText: "View RSS Feed Subscriptions",
        onButtonClick: () => {
          navigate(`/rag/workspaces/${props.data.workspace?.value}?tab=rss`);
        },
      });

      onChange({ websiteUrl: "" }, true);
    } else {
      setGlobalError(Utils.getErrorMessage(result));
    }

    props.setSubmitting(false);
  };

  const hasReadyWorkspace =
    typeof props.data.workspace?.value !== "undefined" &&
    typeof props.selectedWorkspace !== "undefined" &&
    props.selectedWorkspace.status === "ready";

  return (
    <Form
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            data-testid="create"
            variant="primary"
            onClick={onSubmit}
            disabled={props.submitting || !hasReadyWorkspace}
          >
            Subscribe to RSS Feed
          </Button>
        </SpaceBetween>
      }
      errorText={globalError}
    >
      <SpaceBetween size="l">
        <Container>
          <SpaceBetween size="l">
            <FormField
              label="RSS Feed URL"
              errorText={errors.websiteUrl}
              description="Address should start with http:// or https://"
            >
              <Input
                placeholder="https://example.com/rss"
                disabled={props.submitting}
                type="url"
                value={data.websiteUrl}
                onChange={({ detail: { value } }) =>
                  onChange({ websiteUrl: value })
                }
              />
            </FormField>
            <FormField
              label="RSS Feed Title"
              description="Give your feed a title to recognize it in the future"
            >
              <Input
                placeholder="Cool RSS Feed"
                disabled={props.submitting}
                type="text"
                value={data.feedTitle}
                onChange={({ detail: { value } }) =>
                  onChange({ feedTitle: value })
                }
              />
            </FormField>
          </SpaceBetween>
        </Container>
        {flashbarItem !== null && <Flashbar items={[flashbarItem]} />}
      </SpaceBetween>
    </Form>
  );
}
