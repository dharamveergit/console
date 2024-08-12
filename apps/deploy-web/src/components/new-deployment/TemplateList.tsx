"use client";
import React, { Dispatch, useEffect, useState } from "react";
import { Button, buttonVariants } from "@akashnetwork/ui/components";
import { ArrowRight, Cpu, Github, NavArrowLeft, Page, Rocket, Wrench } from "iconoir-react";
import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTemplates } from "@src/context/TemplatesProvider";
import { usePreviousRoute } from "@src/hooks/usePreviousRoute";
import sdlStore from "@src/store/sdlStore";
import { ApiTemplate } from "@src/types";
import { RouteStepKeys } from "@src/utils/constants";
import { cn } from "@src/utils/styleUtils";
import { ubuntuTemplate } from "@src/utils/templates";
import { domainName, NewDeploymentParams, UrlService } from "@src/utils/urlUtils";
import { CustomNextSeo } from "../shared/CustomNextSeo";
import { TemplateBox } from "../templates/TemplateBox";
import { DeployOptionBox } from "./DeployOptionBox";

const previewTemplateIds = [
  "akash-network-cosmos-omnibus-cosmoshub",
  "akash-network-cosmos-omnibus-juno",
  "akash-network-cosmos-omnibus-osmosis",
  "akash-network-cosmos-omnibus-akash",
  "akash-network-cosmos-omnibus-stargaze",
  "akash-network-cosmos-omnibus-kava",
  // "akash-network-cosmos-omnibus-chihuahua",
  "akash-network-awesome-akash-wordpress",
  // "akash-network-awesome-akash-pgadmin4",
  "akash-network-awesome-akash-minecraft"
];

type Props = {
  setGithub: Dispatch<boolean>;
};
export const TemplateList: React.FunctionComponent<Props> = ({ setGithub }) => {
  const { templates } = useTemplates();
  const router = useRouter();
  const [previewTemplates, setPreviewTemplates] = useState<ApiTemplate[]>([]);
  const [, setSdlEditMode] = useAtom(sdlStore.selectedSdlEditMode);
  const previousRoute = usePreviousRoute();
  const handleGithubTemplate = async () => {
    setGithub(true);
    router.push(UrlService.newDeployment({ step: RouteStepKeys.editDeployment, type: "github" }));
  };
  useEffect(() => {
    if (templates) {
      const _previewTemplates = templates.filter(x => previewTemplateIds.some(y => x.id === y));
      setPreviewTemplates(_previewTemplates);
    }
  }, [templates]);

  function onSDLBuilderClick(page: NewDeploymentParams["page"] = "new-deployment") {
    setSdlEditMode("builder");
    router.push(UrlService.newDeployment({ step: RouteStepKeys.editDeployment, page }));
  }

  function handleBackClick() {
    if (previousRoute) {
      router.back();
    } else {
      router.push(UrlService.deploymentList());
    }
  }

  return (
    <>
      <CustomNextSeo title="Create Deployment - Template List" url={`${domainName}${UrlService.newDeployment({ step: RouteStepKeys.chooseTemplate })}`} />

      <div className="mb-8 mt-8 flex items-center">
        <Button aria-label="back" onClick={handleBackClick} size="icon" variant="ghost">
          <NavArrowLeft />
        </Button>
        <h1 className="ml-4 text-2xl">
          <strong>What do you want to deploy?</strong>
        </h1>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-4">
          {/* <DeployOptionBox
            title={helloWorldTemplate.title}
            description={helloWorldTemplate.description}
            icon={<Rocket className="rotate-45" />}
            onClick={() => router.push(UrlService.newDeployment({ step: RouteStepKeys.editDeployment, templateId: helloWorldTemplate.code }))}
          /> */}
          <DeployOptionBox
            title={"Build and Deploy"}
            description={"Deploy directly from GitHub/BitBucket/GitLab"}
            icon={<Rocket />}
            onClick={handleGithubTemplate}
          />
          <DeployOptionBox
            title="Rent GPUs"
            description="Rent GPUs from the Akash Network providers to run your AI workloads."
            icon={<Cpu />}
            onClick={() => router.push(UrlService.rentGpus())}
          />

          <DeployOptionBox
            title="Build your template"
            description="With our new SDL Builder, you can create your own SDL from scratch in a few clicks!"
            icon={<Wrench />}
            onClick={() => onSDLBuilderClick()}
            testId="build-template-card"
          />

          {
            <DeployOptionBox
              title="Plain Linux"
              description="Choose from multiple linux distros. Deploy and SSH into it. Install and run what you want after."
              icon={<Page />}
              onClick={() => onSDLBuilderClick("deploy-linux")}
              testId="plain-linux-card"
            />
          }
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <h5>
          <strong>Staff Picks</strong>
        </h5>

        <Link href={UrlService.templates()} className="ml-4 flex items-center">
          Search marketplace
          <ArrowRight className="ml-2 text-xs" />
        </Link>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <DeployOptionBox
            title={ubuntuTemplate.title}
            description={ubuntuTemplate.description}
            imageUrl="/images/ubuntu.png"
            onClick={() => router.push(UrlService.newDeployment({ step: RouteStepKeys.editDeployment, templateId: ubuntuTemplate.code }))}
          />

          {previewTemplates.map(template => (
            <TemplateBox
              key={template.id}
              template={template}
              linkHref={UrlService.newDeployment({ step: RouteStepKeys.editDeployment, templateId: template?.id })}
            />
          ))}
        </div>
      </div>

      <div className="pb-8 text-center">
        <Link href={UrlService.templates()} className={cn(buttonVariants({ size: "lg", variant: "default" }))}>
          See all categories
        </Link>
      </div>
    </>
  );
};
