"use client";
import { ReactNode, useEffect } from "react";
import { Control, Controller, useFieldArray } from "react-hook-form";
import { Button, CustomNoDivTooltip, FormInput, Switch } from "@akashnetwork/ui/components";
import { Bin } from "iconoir-react";
import { nanoid } from "nanoid";

import { EnvironmentVariable, RentGpusFormValues, SdlBuilderFormValues } from "@src/types";
import { cn } from "@src/utils/styleUtils";
import { FormPaper } from "../sdl/FormPaper";
import { hiddenEnv } from "./utils";

type Props = {
  serviceIndex: number;
  onClose: () => void;
  envs: EnvironmentVariable[];
  control: Control<SdlBuilderFormValues | RentGpusFormValues, any>;
  hasSecretOption?: boolean;
  children?: ReactNode;
};

export const EnvFormModal: React.FunctionComponent<Props> = ({ control, serviceIndex, envs: _envs, onClose, hasSecretOption = true }) => {
  const {
    fields: envs,
    remove: removeEnv,
    append: appendEnv
  } = useFieldArray({
    control,
    name: `services.${serviceIndex}.env`,
    keyName: "id"
  });

  useEffect(() => {
    if (_envs.length === 0) {
      onAddEnv();
    }
  }, []);

  const onAddEnv = () => {
    appendEnv({ id: nanoid(), key: "", value: "", isSecret: false });
  };

  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <h1 className="text-sm font-bold">Environment Variables</h1>
      <FormPaper contentClassName=" ">
        {envs.map((env, envIndex) => {
          return (
            <div key={env.id} className={cn("flex", { ["mb-2"]: envIndex + 1 !== envs.length }, { ["hidden"]: hiddenEnv.includes(env.key) })}>
              <div className="flex flex-grow flex-col items-end sm:flex-row">
                <Controller
                  control={control}
                  name={`services.${serviceIndex}.env.${envIndex}.key`}
                  render={({ field }) => (
                    <div className="basis-[40%]">
                      <FormInput
                        type="text"
                        label="Key"
                        color="secondary"
                        value={field.value}
                        onChange={event => field.onChange(event.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name={`services.${serviceIndex}.env.${envIndex}.value`}
                  render={({ field }) => (
                    <div className="ml-2 flex-grow">
                      <FormInput
                        type="text"
                        label="Value"
                        color="secondary"
                        value={field.value}
                        onChange={event => field.onChange(event.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                />
              </div>

              <div
                className={cn("flex w-[50px] flex-col items-start pl-2", {
                  ["justify-between"]: envIndex > 0,
                  ["justify-end"]: envIndex === 0 || !hasSecretOption
                })}
              >
                {envIndex > 0 && (
                  <Button onClick={() => removeEnv(envIndex)} size="icon" variant="ghost">
                    <Bin />
                  </Button>
                )}

                {hasSecretOption && (
                  <Controller
                    control={control}
                    name={`services.${serviceIndex}.env.${envIndex}.isSecret`}
                    render={({ field }) => (
                      <CustomNoDivTooltip
                        title={
                          <>
                            <p>
                              <strong>Secret</strong>
                            </p>
                            <p className="text-sm">
                              This is for secret variables containing sensitive information you don't want to be saved in your template.
                            </p>
                          </>
                        }
                      >
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                      </CustomNoDivTooltip>
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </FormPaper>
      <Button onClick={onAddEnv} size="sm" variant="default" className="w-min">
        Add Variable
      </Button>
    </div>
  );
};
