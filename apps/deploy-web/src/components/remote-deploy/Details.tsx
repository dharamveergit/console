import { useState } from "react";
import { Card, CardContent, Collapsible, CollapsibleContent, CollapsibleTrigger, Separator } from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import { NavArrowDown } from "iconoir-react";

import CustomInput from "./CustomInput";
import { appendEnv } from "./utils";

const Details = ({ services, setValue }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={value => {
        setExpanded(value);
      }}
    >
      <Card className="mt-4 rounded-sm border border-muted-foreground/20">
        <CardContent className="p-0">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4">
              <h1 className="font-semibold">Details</h1>
              <NavArrowDown fontSize="1rem" className={cn("transition-all duration-100", { ["rotate-180"]: expanded })} />
            </div>
          </CollapsibleTrigger>
          {expanded && <Separator />}
          <CollapsibleContent>
            <div className="grid gap-6 p-5 md:grid-cols-2">
              <CustomInput
                onChange={e => appendEnv("BUILD_DIRECTORY", e.target.value, false, setValue, services)}
                label="Build Directory"
                description="The Repository Branch used for your private service"
                placeholder="eg. anything"
              />
              <CustomInput
                onChange={e => appendEnv("BUILD_COMMAND", e.target.value, false, setValue, services)}
                label="Build Command"
                description="A unique name for your web service."
                placeholder="$ yarn"
              />
              <CustomInput
                onChange={e => appendEnv("CUSTOM_SRC", e.target.value, false, setValue, services)}
                label="Start Command"
                description="The Repository Branch used for your private service"
                placeholder="$ yarn start"
              />
              <CustomInput
                onChange={e => appendEnv("NODE_VERSION", e.target.value, false, setValue, services)}
                label="Node Version"
                description="The Repository Branch used for your private service"
                placeholder="14"
              />
              <CustomInput
                onChange={e => appendEnv("COMMIT_HASH", e.target.value, false, setValue, services)}
                label="Commit Hash"
                description="The Repository Branch used for your private service"
                placeholder="eg. anything"
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
export default Details;