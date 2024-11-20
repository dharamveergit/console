"use client";
import { FC, useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";

import { USER_TEMPLATE_CODE } from "@src/config/deploy.config";
import { CI_CD_TEMPLATE_ID } from "@src/config/remote-deploy.config";
import { useLocalNotes } from "@src/context/LocalNoteProvider";
import { useSdlBuilder } from "@src/context/SdlBuilderProvider";
import { useTemplates } from "@src/context/TemplatesProvider";
import { isImageInYaml } from "@src/services/remote-deploy/remote-deployment-controller.service";
import sdlStore from "@src/store/sdlStore";
import { TemplateCreation } from "@src/types";
import { RouteStep } from "@src/types/route-steps.type";
import { hardcodedTemplates } from "@src/utils/templates";
import { UrlService } from "@src/utils/urlUtils";
import Layout from "../layout/Layout";
import { CreateLease } from "./CreateLease";
import { ManifestEdit } from "./ManifestEdit";
import { CustomizedSteppers } from "./Stepper";
import { TemplateList } from "./TemplateList";

const DEBUG = process.env.NODE_ENV === "development";

interface TemplateState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export const NewDeploymentContainer: FC = () => {
  const [isGitProviderTemplate, setIsGitProviderTemplate] = useState<boolean>(false);
  const { isLoading: isLoadingTemplates, templates, getTemplateById } = useTemplates();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCreation | null>(null);
  const [editedManifest, setEditedManifest] = useState<string | null>(null);
  const [templateState, setTemplateState] = useState<TemplateState>({
    initialized: false,
    loading: false,
    error: null,
    retryCount: 0
  });

  const deploySdl = useAtomValue(sdlStore.deploySdl);
  const { getDeploymentData } = useLocalNotes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dseq = searchParams?.get("dseq");
  const { toggleCmp, hasComponent } = useSdlBuilder();

  const logDebug = useCallback((message: string, data?: any) => {
    if (DEBUG) {
      console.log(`[NewDeploymentContainer] ${message}`, data || "");
    }
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      logDebug("Error:", error);
      setTemplateState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    },
    [logDebug]
  );

  // Step 1: Parse URL parameters and set initial state
  useEffect(() => {
    try {
      const queryStep = searchParams?.get("step");
      const code = searchParams?.get("code");
      const gitProvider = searchParams?.get("gitProvider");
      const state = searchParams?.get("state");
      const templateId = searchParams?.get("templateId");
      const redeploy = searchParams?.get("redeploy");

      logDebug("URL Parameters:", { queryStep, code, gitProvider, state, templateId });

      const _activeStep = getStepIndexByParam(queryStep as RouteStep);
      setActiveStep(_activeStep);

      const shouldRedirectToGitlab = !redeploy && state === "gitlab" && code;
      const isGitProvider = gitProvider === "github" || code || state === "gitlab" || (templateId && templateId === CI_CD_TEMPLATE_ID);

      if (shouldRedirectToGitlab) {
        router.replace(
          UrlService.newDeployment({
            step: RouteStep.editDeployment,
            gitProvider: "github",
            gitProviderCode: code,
            templateId: CI_CD_TEMPLATE_ID
          })
        );
      } else {
        setIsGitProviderTemplate(!!isGitProvider);
        // Reset template state when URL parameters change
        setTemplateState(prev => ({
          ...prev,
          initialized: false,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [searchParams, router, logDebug, handleError]);

  // Step 2: Template initialization
  const initializeTemplate = useCallback(async () => {
    try {
      logDebug("Starting template initialization");

      const templateId = searchParams?.get("templateId");
      const isCreating = !!activeStep && activeStep > getStepIndexByParam(RouteStep.chooseTemplate);

      if (isCreating && !!editedManifest && !!templateId) {
        logDebug("Template already initialized");
        return;
      }

      setTemplateState(prev => ({ ...prev, loading: true }));

      const template = getRedeployTemplate() || getGalleryTemplate() || deploySdl;
      logDebug("Selected template:", template);

      if (!template) {
        logDebug("No template found");
        setTemplateState(prev => ({
          ...prev,
          loading: false,
          error: "No template found"
        }));
        return;
      }

      const isUserTemplate = template?.code === USER_TEMPLATE_CODE;
      const isUserTemplateInit = isUserTemplate && !!editedManifest;

      if (isUserTemplateInit) {
        logDebug("User template already initialized");
        return;
      }

      setSelectedTemplate(template as TemplateCreation);
      setEditedManifest(template.content as string);

      if ("config" in template && (template.config?.ssh || (!template.config?.ssh && hasComponent("ssh")))) {
        toggleCmp("ssh");
      }

      const isRemoteYamlImage = template.content ? isImageInYaml(template.content as string, getTemplateById(CI_CD_TEMPLATE_ID)?.deploy) : false;

      const queryStep = searchParams?.get("step");
      if (queryStep !== RouteStep.editDeployment) {
        const newParams = isRemoteYamlImage ? { step: RouteStep.editDeployment, gitProvider: "github" } : { step: RouteStep.editDeployment };

        router.replace(UrlService.newDeployment(newParams));
      }

      setTemplateState(prev => ({
        ...prev,
        initialized: true,
        loading: false,
        error: null
      }));

      logDebug("Template initialization completed");
    } catch (error) {
      handleError(error as Error);

      // Implement retry logic
      if (templateState.retryCount < 3) {
        logDebug("Retrying template initialization");
        setTimeout(() => {
          setTemplateState(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1,
            initialized: false,
            loading: false
          }));
        }, 1000); // Retry after 1 second
      }
    }
  }, [searchParams, activeStep, editedManifest, deploySdl, getTemplateById, hasComponent, toggleCmp, router, templateState.retryCount, logDebug, handleError]);

  // Step 3: Watch for template loading state
  useEffect(() => {
    if (!isLoadingTemplates && templates && !templateState.initialized && !templateState.loading) {
      logDebug("Templates loaded, triggering initialization");
      initializeTemplate();
    }
  }, [isLoadingTemplates, templates, templateState.initialized, templateState.loading, initializeTemplate, logDebug]);

  const getRedeployTemplate = useCallback(() => {
    let template: Partial<TemplateCreation> | null = null;
    const queryRedeploy = searchParams?.get("redeploy");

    if (queryRedeploy) {
      const deploymentData = getDeploymentData(queryRedeploy as string);
      if (deploymentData && deploymentData.manifest) {
        template = {
          name: deploymentData.name,
          code: "empty",
          content: deploymentData.manifest
        };
      }
    }

    return template;
  }, [searchParams, getDeploymentData]);

  const getGalleryTemplate = useCallback((): Partial<{
    code: string;
    name: string;
    content: string;
    valuesToChange: any[];
    config: { ssh?: boolean };
  }> | null => {
    const queryTemplateId = searchParams?.get("templateId");
    if (!queryTemplateId) return null;

    const templateById = getTemplateById(queryTemplateId as string);
    if (templateById) {
      return {
        code: "empty",
        name: templateById.name,
        content: templateById.deploy,
        valuesToChange: templateById.valuesToChange || [],
        config: templateById.config
      };
    }

    return hardcodedTemplates.find(t => t.code === queryTemplateId) || null;
  }, [searchParams, getTemplateById]);

  function getStepIndexByParam(step: (typeof RouteStep)[keyof typeof RouteStep] | null) {
    switch (step) {
      case RouteStep.editDeployment:
        return 1;
      case RouteStep.createLeases:
        return 2;
      case RouteStep.chooseTemplate:
      default:
        return 0;
    }
  }

  return (
    <Layout isUsingSettings isUsingWallet containerClassName="pb-0 h-full">
      {!!activeStep && (
        <div className="flex w-full items-center">
          <CustomizedSteppers activeStep={activeStep} />
        </div>
      )}

      {activeStep === 0 && (
        <TemplateList onChangeGitProvider={setIsGitProviderTemplate} onTemplateSelected={setSelectedTemplate} setEditedManifest={setEditedManifest} />
      )}
      {activeStep === 1 && (
        <ManifestEdit
          selectedTemplate={selectedTemplate}
          onTemplateSelected={setSelectedTemplate}
          editedManifest={editedManifest}
          setEditedManifest={setEditedManifest}
          isGitProviderTemplate={isGitProviderTemplate}
        />
      )}
      {activeStep === 2 && <CreateLease dseq={dseq as string} />}
    </Layout>
  );
};
