
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
import { ChangeEvent, CSSProperties } from "react"
import { ImportTabProps } from "../types";
import BarLoader from "react-spinners/BarLoader";

export function ImportTab(props: ImportTabProps){

  const importFile = async (event : ChangeEvent<HTMLInputElement>) =>{
    props.importStates.setLoading(true);
    const newFiles: FileList | null = event.target.files;
    if (newFiles != null){

      const fileContent = await parseImageFile(newFiles[0]);
      props.webSockets.server.send(JSON.stringify({
        "channel": "server",
        "command": "dials.import", 
        "filename" : newFiles[0].name, 
        "file" : fileContent}
      ));
    }

  }

  const parseImageFile = (file : File) => {
    const reader: FileReader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing image file."));
      };

      reader.onloadend = () => {
        resolve(reader.result);
        return reader.result;
      }
      reader.readAsDataURL(file);    
    });
  }

const barLoaderCSSOverride: CSSProperties = {
  display: "block",
  margin: "0 auto",
  marginTop: "10vh",
  borderColor: "red",
};


	return (
        <Card className="w-full md:w-full lg:w-full xl:w-full h-full md:h-full lg:h-full xl:h-full">
          <CardHeader>
            <Label htmlFor="image-files">Image files</Label>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-start-1 col-end-4 ...">
                <Input id="image-files" type="file" onChange={importFile} />
              </div>
              <div className="col-end-8 col-span-1 ...">
                <a href="https://dials.github.io/documentation/programs/dials_import.html" target="_blank">
                  <Button variant={"secondary"}>Documentation </Button>
                </a>

              </div>
            </div>
            <div className="space-y-1">
              <Label>Advanced Options</Label>
              <Input placeholder="See Documentation for full list of options" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Card className="h-[600px]">
            <CardHeader>
              <CardDescription>
                DIALS Output
              </CardDescription>
            </CardHeader>
            <CardContent>
              {props.importStates.loading ? 
              
              <BarLoader
                color={"#ffffff"}
                loading={props.importStates.loading}
                aria-label="Loading Spinner"
                data-testid="loader"
                cssOverride={barLoaderCSSOverride}
                width={400}
              />
            :
              <div dangerouslySetInnerHTML={{__html:props.importStates.log}} />
            }

            </CardContent>
          </Card>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
	)
}
