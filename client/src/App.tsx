import { useEffect, useState, useRef } from "react"
import { AlgorithmTabs } from "./components/AlgorithmTabs"
import { StateTabs } from "./components/StateTabs"
import { FileTree } from "./components/FileTree"
import { ReflectionTableSheet } from "./components/ReflectionTable"
import { ExperimentViewerStates,  LineplotData, LineplotBboxData, LineplotCentroidData, RLVStates} from "./types"
import { ImportStates, FindSpotsStates, IndexStates, RefineStates, IntegrateStates} from "./types";
import { LoadingScreen } from "./components/LoadingScreen"
import { ExperimentSummary } from "./components/ExperimentSummary"
import { Reflection } from "./types"

/*
WebSocket Channels

server
experiment_viewer
rlv
gui

GUI Commands

update_import_log
update_find_spots_log
update_index_log
update_refine_log
update_integrate_log
*/

function App() {

  const serverWS = useRef<WebSocket | null>(null);

  /*
    Loading states
  */
  const [appLoading, setAppLoading] = useState<boolean>(false);
  const [minAppLoading, setMinAppLoading] = useState<boolean>(false);

  useEffect(() => {
    setAppLoading(true)
    setMinAppLoading(true)
    connectToServer();
    setTimeout(() => {
      setMinAppLoading(false)
    }, 2000)
  }, [])

  /*
    Summary states
   */

  const [instrumentName, setInstrumentName] = useState<string>("");
  const [experimentDescription, setExperimentDescription] = useState<string>("");
  const [reflectionsSummary, setReflectionsSummary] = useState<string>("");
  const [crystalSummary, setCrystalSummary] = useState<string>("");
  const [integrationSummary, setintegrationSummary] = useState<string>("");

  const [reflectionTableEnabled, setReflectionTableEnabled] = useState<boolean>(false);

  /*
    Algorithm states
  */

  // ImportTab
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importLog, setImportLog] = useState<string>("");

  // FindSpotsTab
  const [findSpotsEnabled, setFindSpotsEnabled] = useState<boolean>(false);
  const [findSpotsLoading, setFindSpotsLoading] = useState<boolean>(false);
  const [findSpotsLog, setFindSpotsLog] = useState<string>("");

  // IndexTab
  const [indexEnabled, setIndexEnabled] = useState<boolean>(false);
  const [indexLoading, setIndexLoading] = useState<boolean>(false);
  const [indexLog, setIndexLog] = useState<string>("");

  // RefineTab
  const [refineEnabled, setRefineEnabled] = useState<boolean>(false);
  const [refineLoading, setRefineLoading] = useState<boolean>(false);
  const [refineLog, setRefineLog] = useState<string>("");

  // IntegrateTab
  const [integrateEnabled, setIntegrateEnabled] = useState<boolean>(false);
  const [integrateLoading, setIntegrateLoading] = useState<boolean>(false);
  const [integrateLog, setIntegrateLog] = useState<string>("");

  const importStates: ImportStates = {
      setLog: setImportLog, 
      log: importLog, 
      setLoading: setImportLoading, 
      loading: importLoading,
  };
  const findSpotsStates: FindSpotsStates = {
      setLog: setFindSpotsLog, 
      enabled : findSpotsEnabled,
      loading: findSpotsLoading,
      setLoading: setFindSpotsLoading, 
      log: findSpotsLog, 
  };
  const indexStates: IndexStates = {
      setLog: setIndexLog, 
      enabled : indexEnabled,
      loading: indexLoading,
      setLoading: setIndexLoading, 
      log: indexLog, 
  };
  const refineStates : RefineStates = {
      setLog: setRefineLog, 
      enabled : refineEnabled,
      loading: refineLoading,
      setLoading: setRefineLoading, 
      log: refineLog, 
  };
  const integrateStates : IntegrateStates = {
      setLog: setIntegrateLog, 
      enabled : integrateEnabled,
      loading: integrateLoading,
      setLoading: setIntegrateLoading, 
      log: integrateLog, 
  };

  /*
    StateTabs states
  */

  const initialLineplotData: LineplotData[] = [{x:0, y:0}]; 
  const [lineplot, setLineplot] = useState<LineplotData[]>(initialLineplotData);

  const initialLineplotBboxData: LineplotBboxData[] = []; 
  const [lineplotBboxData, setLineplotBboxData] = useState<LineplotBboxData[]>(initialLineplotBboxData);

  const initialLineplotCentroidData: LineplotCentroidData[] = []; 
  const [lineplotCentroidData, setLineplotCentroidData] = useState<LineplotCentroidData[]>(initialLineplotCentroidData);

  const [lineplotTitle, setLineplotTitle] = useState<string>("-");

  const [experimentViewerHidden, setExperimentViewerHidden] = useState<boolean>(false);
  const [rLVEnabled, setRLVEnabled] = useState<boolean>(false);
  const [rLVHidden, setRLVHidden] = useState<boolean>(false);

  const experimentViewerStates: ExperimentViewerStates = {
      lineplotData : lineplot,
      lineplotBboxData: lineplotBboxData,
      lineplotCentroidData: lineplotCentroidData,
      lineplotTitle : lineplotTitle,
      hidden : experimentViewerHidden,
      setHidden : setExperimentViewerHidden

  }

  const rLVStates: RLVStates = {
    enabled : rLVEnabled,
    hidden : rLVHidden,
    setHidden : setRLVHidden
  }

  const emptyReflectionTable : Reflection[] = [
    {
      id : "0",
      panel : "-", 
      panelName: "-",
      millerIdx : "-", 
      XYZObs : "-", 
      XYZCal : "-", 
      wavelength : "-",
      tof : "-"
    }
  ]

  const [reflectionTable, setReflectionTable] = useState<Reflection[]>(emptyReflectionTable)
  const [selectedReflectionId, setSelectedReflectionId] = useState<string>("");

  function updateReflectionTable(msg: any){
    const panelKeys = Object.keys(msg);
    const reflections: Reflection[] = [];

    var count : number = 0;
    for (var i = 0; i < panelKeys.length; i++){
      const panelReflections = msg[panelKeys[i]];
      for (var j = 0; j < panelReflections.length; j++){
        const refl = panelReflections[j];
        reflections.push({
          id: count.toString(),
          panel: panelKeys[i],
          panelName: refl["panelName"],
          millerIdx : "millerIdx" in refl && refl["indexed"]? "(" + refl["millerIdx"][0] + ", " + refl["millerIdx"][1] + ", " + refl["millerIdx"][2] + ")": "-",
          XYZObs: "xyzObs" in refl ? "(" + refl["xyzObs"][1].toFixed(0) + ", " + refl["xyzObs"][0].toFixed(0) + ")":  "-",
          XYZCal: "xyzCal" in refl && refl["indexed"]? "(" + refl["xyzCal"][1].toFixed(0) + ", " + refl["xyzCal"][0].toFixed(0) + ")" :  "-",
          wavelength: "wavelength" in refl ? refl["wavelength"].toFixed(3) : "-",
          tof: "tof" in refl ? (refl["tof"]*10**6).toFixed(3) : "-"
        });
        count++;
      }
    }

    setReflectionTable(reflections);
  }

  function connectToServer(){

    console.log("connect to server called");
    serverWS.current = new WebSocket("ws://127.0.0.1:8888/");

    serverWS.current.onopen = () => {
        console.log('Frontend opened connection to server');
        serverWS.current?.send(JSON.stringify({
          "channel": "server",
          "command": "record_connection", 
          "id": "gui"
          }
        ));
        setAppLoading(false);
    };

    serverWS.current.onerror=(event)=>{
      console.log("Frontend connection error:", event);
    }

    serverWS.current.onclose = () => {
        console.log('Frontend closed connection to server')
        serverWS.current = null;
        setTimeout(connectToServer, 5000);
    };

    function is_gui_msg(msg: any){
      return "channel" in msg && msg["channel"] == "gui";
    }

    serverWS.current.onmessage = (event: any) => {
        const msg: any = JSON.parse(event.data);

        console.log("frontend msg received ", msg);

        if (!is_gui_msg(msg)){ return; }

        const command = msg["command"];

        switch(command){
          case "update_import_log":
            setImportLog(msg["log"]);
            break;
          case "update_experiment":
            setImportLoading(false);
            setFindSpotsEnabled(true);
            setInstrumentName("<b>Instrument: </b>" + msg["instrument_name"]);
            setExperimentDescription("<b> Experiment: </b>" + msg["experiment_description"]);
            setRLVHidden(true);
            break;
          case "update_find_spots_log":
            setFindSpotsLog(msg["log"]);
            if (!("reflections_summary" in msg)){
              break;
            }
            setFindSpotsLoading(false);
            setIndexEnabled(true);
            setReflectionsSummary("Identified " + msg["reflections_summary"])
            setRLVEnabled(true);
            setReflectionTableEnabled(true);
            updateReflectionTable(msg["reflection_table"]);
            break;
          case "update_index_log":
            setIndexLog(msg["log"]);
            if (!("reflections_summary" in msg)){
              break;
            }
            setIndexLoading(false);
            setRefineEnabled(true);
            setReflectionsSummary("Identified " + msg["reflections_summary"])
            setCrystalSummary("<b> Unit Cell: </b>" + msg["crystal_summary"]);
            setRLVEnabled(true);
            setReflectionTableEnabled(true);
            updateReflectionTable(msg["reflection_table"]);
            break;
          case "update_refine_log":
            setRefineLog(msg["log"]);
            if (!("reflections_summary" in msg)){
              break;
            }
            setRefineLoading(false);
            setIntegrateEnabled(true);
            setReflectionsSummary("Identified " + msg["reflections_summary"])
            setCrystalSummary("<b> Unit Cell: </b>" + msg["crystal_summary"]);
            setRLVEnabled(true);
            setReflectionTableEnabled(true);
            updateReflectionTable(msg["reflection_table"]);
            break;
          case "update_lineplot":
            const lineplotData: LineplotData[] = [];

            for (var i = 0; i < msg["x"].length; i++){
              lineplotData.push(
                {
                  x: msg["x"][i],
                  y: msg["y"][i]
                }
              )
            }
            setLineplot(lineplotData);
            setLineplotBboxData(msg["bboxPos"]);
            setLineplotTitle(msg["title"]);
            setLineplotCentroidData(msg["centroidPos"]);
            if (msg["centroidPos"].length > 0 && msg["updateTableSelection"] == true){
              setSelectedReflectionId(msg["centroidPos"][0].id);
            }
            break;

          default:
            console.warn("Unrecognised command ", command);
        }
      };

  }


  return (
    <div className="App">
      {
        appLoading || minAppLoading ? 
        <LoadingScreen loading={appLoading} minLoading={minAppLoading}/>
        :
      <div className="grid grid-rows-20 gap-3">
        <div className="row-span-1">
          <div className="grid grid-cols-10">
            <div className="col-span-1">
          <FileTree></FileTree>
          <ReflectionTableSheet 
          enabled={reflectionTableEnabled} 
          reflections={reflectionTable}
          selectedReflectionId={selectedReflectionId}
          setSelectedReflectionId={setSelectedReflectionId}
          serverWS={serverWS}
          ></ReflectionTableSheet>
            </div>
            <div className="col-span-6">
              <ExperimentSummary 
                name={instrumentName} 
                summary={experimentDescription} 
                reflections_summary={reflectionsSummary}
                crystal_summary={crystalSummary}
                integration_summary={integrationSummary}></ExperimentSummary>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="row-span-18">
          <StateTabs 
          experimentViewerStates={experimentViewerStates}
          rLVStates={rLVStates}
          selectedReflectionId={selectedReflectionId}
          setSelectedReflectionId={setSelectedReflectionId}
          />
          </div>
          <div className="row-span-9">
          <AlgorithmTabs 
          importStates={importStates}
          findSpotsStates={findSpotsStates}
          indexStates={indexStates}
          refineStates={refineStates}
          integrateStates={integrateStates}
          serverWS={serverWS}
          />
          </div>
        </div>
            <div>
            <a href="https://dials.github.io" target="_blank">
            <img
              src="./src/assets/dials_logo.png"
      style={{ 
        position: "absolute",
        top: "0vh",
        left: "92vw",
        height: "110px",
        width: "147px"
      }}
              />
            </a>
            </div>
      </div>
      }
    </div>
  )

}


export default App