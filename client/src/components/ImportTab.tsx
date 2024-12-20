
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileText } from '@fortawesome/free-solid-svg-icons';
import { faFileImage } from '@fortawesome/free-solid-svg-icons';

export function ImportTab(props: {
  setLog: React.Dispatch<React.SetStateAction<string>>
  log: string
  loading: boolean
  ranSuccessfully: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  localFileDir: string
  setLocalFileDir: React.Dispatch<React.SetStateAction<string>>
  usingLocalServer: boolean
  setUsingLocalServer: React.Dispatch<React.SetStateAction<boolean>>
  serverWS: React.MutableRefObject<WebSocket | null>
  currentFileKey: string,
  browseImagesEnabled: boolean,
  setBrowseImagesEnabled: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [advancedOptions, setAdvancedOptions] = useState<string>("");

  function getAlgorithmOptions() {


    const algorithmOptions: Record<string, string> = {}

    const keyValuePairs = advancedOptions.split(" ");

    keyValuePairs.forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key != "" && value != undefined) {
        algorithmOptions[key] = value;
      }
    });

    return algorithmOptions;
  }

  function browseImagesForImport() {
      const algorithmOptions = getAlgorithmOptions();
        props.serverWS.current?.send(JSON.stringify({
          "channel": "server",
          "command": "browse_files_for_import",
          "args": algorithmOptions
        }));
        props.setBrowseImagesEnabled(false);

  }

  return (
<Card className="w-full md:w-full h-full flex flex-col">
  <CardHeader>
    <div className="grid grid-cols-6 gap-4">
      <div className="col-start-1 col-span-3">
        <Button
          disabled={!props.browseImagesEnabled}
          onClick={browseImagesForImport}
        >
          <FontAwesomeIcon
            icon={faFileImage}
            style={{ marginRight: "5px", marginTop: "0px" }}
          />
          {props.currentFileKey !== "" ? props.currentFileKey : "Browse"}
        </Button>
      </div>
      <div className="col-end-8 col-span-1">
        <a
          href="src/assets/documentation/_build/html/docs/importing_data.html"
          target="_blank"
        >
          <Button variant={"secondary"}>
            <FontAwesomeIcon
              icon={faFileText}
              style={{ marginRight: "5px", marginTop: "0px" }}
            />
            Documentation
          </Button>
        </a>
      </div>
    </div>
    <div className="space-y-1">
      <Label>Advanced Options</Label>
      <Input
        onChange={(e) => setAdvancedOptions(e.target.value)}
        placeholder="See Documentation for full list of options"
      />
    </div>
  </CardHeader>

  <CardContent className="flex-1 flex flex-col">
    <Card
      className={
        props.loading ? "flex-1 flex flex-col overflow-y-hidden custom-scrollbar border border-white" :
        props.ranSuccessfully ? "flex-1 flex flex-col overflow-y-hidden custom-scrollbar border" : "flex-1 flex flex-col overflow-y-scroll custom-scrollbar border border-red-500"
      }
    >
      <CardHeader>
        <CardDescription>DIALS Output</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-scroll">
        {props.loading ? (
          <div
            style={{ opacity: 0.5 }}
            dangerouslySetInnerHTML={{ __html: props.log }}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: props.log }} />
        )}
      </CardContent>
    </Card>
  </CardContent>

  <CardFooter />
</Card>


  )
}
