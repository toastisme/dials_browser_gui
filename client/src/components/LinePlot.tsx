import { ResponsiveContainer, Label, LineChart, Line, XAxis, YAxis, ReferenceArea, ReferenceDot } from 'recharts';
import { LineplotBboxData, LineplotCentroidData, LineplotData } from '@/types';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button"

export function LinePlot(props: {
	lineplotData: LineplotData[], 
	lineplotBboxData: LineplotBboxData[], 
	lineplotCentroidData: LineplotCentroidData[], 
	lineplotTitle: string, 
	selectedReflectionId: string,
	setSelectedReflectionId: React.Dispatch<React.SetStateAction<string>>,
	}) {

	const minSelectionWidth: number = 200;

	interface LinePlotZoomStates{
		data: LineplotData[],
		left: number | string,
		right: number | string,
		refAreaLeft: number | string,
		refAreaRight: number | string,
		top: number | string,
		bottom: number | string,
		animation: boolean
	}

	const initialState: LinePlotZoomStates = {
		data: props.lineplotData,
		left: "dataMin",
		right: "dataMax",
		refAreaLeft: "",
		refAreaRight: "",
		top: "dataMax",
		bottom: "dataMin",
		animation: true
	};

	const [state, setState] = useState<LinePlotZoomStates>(initialState);
	const [zoomOutEnabled, setZoomOutEnabled] = useState<boolean>(false);

	const findIndexByX = (dataArray: LineplotData[], targetX: number): number => {
 	 const xValues = dataArray.map((item) => item.x);
 	 return xValues.indexOf(targetX);
	};

	const getAxisYDomain = (
	from: number,
	to: number,
	offset: number
	) : [number | null, number | null] => {

	from = findIndexByX(props.lineplotData, from);
	to = findIndexByX(props.lineplotData, to);
	const refData: any[] = props.lineplotData.slice(from - 1, to);
	if (refData == null || refData == undefined){
		return [null, null];
	}
	let [bottom, top] = [0, refData[0]["y"]];

	refData.forEach((d) => {
		if (d["y"] > top) top = d["y"];
	});

	return [bottom, (top * 1.2 | 0) + offset];
	};


	useEffect(() => {

		const maxDataPoint = Math.max(...props.lineplotData.map(entry => entry.y));
		const topValue = maxDataPoint * 1.2; // 20% buffer

		setState({
		...state,
		data: props.lineplotData,
		refAreaLeft: "",
		refAreaRight: "",
		left: "dataMin",
		right: "dataMax",
		top: topValue,
		bottom: "dataMin",
		});

	}, [props.lineplotData]);


	const zoom = () : void => {
		let { refAreaLeft, refAreaRight } = state;
		const { data } = state;

		if (refAreaLeft === refAreaRight || refAreaRight === "") {
			setState({
				...state,
				refAreaLeft: "",
				refAreaRight: ""
			});
			return;
		}
		if (!(typeof refAreaLeft === "number" && typeof refAreaRight === "number")){
			setState({
				...state,
				refAreaLeft: "",
				refAreaRight: ""
			});
			return;

		}
		// xAxis domain
		if (refAreaLeft > refAreaRight)
		[refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

		if (refAreaRight - refAreaLeft < minSelectionWidth){
			setState({
				...state,
				refAreaLeft: "",
				refAreaRight: ""
			});
			return;
		} 

		const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight, 0);
		if (bottom == null || top == null){
			return;
		}

		setState({
		...state,
		refAreaLeft: "",
		refAreaRight: "",
		data: data.slice(),
		left: refAreaLeft,
		right: refAreaRight,
		bottom: bottom,
		top: top
		});

		setZoomOutEnabled(true);
	};

	const zoomOut = () : void => {
		const { data } = state;
		const maxDataPoint = Math.max(...props.lineplotData.map(entry => entry.y));
		const topValue = maxDataPoint * 1.2; // 20% buffer
		setState({
		...state,
		data: data.slice(),
		refAreaLeft: "",
		refAreaRight: "",
		left: "dataMin",
		right: "dataMax",
		top: topValue,
		bottom: "dataMin",
		});
		setZoomOutEnabled(false);
	};


	function selectReflection(id: string){
		props.setSelectedReflectionId(id);
	}

	function validMillerIdx(millerIdx: number[]) : boolean
	{
		if (millerIdx.length != 3){
			return false;
		}
		for (var i=0; i < 3; i++){
			if (millerIdx[i] != 0){
				return true;
			}
		}
		return false;

	}



  return (
    <div>
      <h4>{props.lineplotTitle}</h4>
	  <ResponsiveContainer width="100%" height={200}>
		<div>
      <Button disabled={!zoomOutEnabled} variant="outline" className="btn update" onClick={zoomOut} style={{fontSize: '20px', padding: "10px 10px"}} >
        <FontAwesomeIcon icon={faArrowsAlt} /> 
      </Button>
      <LineChart
        width={860}
        height={200}
        data={state.data}
        margin={{
          bottom: 25,
          left: 10
        }}
		onMouseDown={(e: any) => {
			setState({ ...state, refAreaLeft: e.activeLabel })}}
        onMouseMove={(e: any) =>
          {
			if (e!=null){state.refAreaLeft && setState({ ...state, refAreaRight: e.activeLabel })}
		  }
        }
        onMouseUp={zoom}
      >
        <XAxis dataKey="x" type="number" domain={[state.left, state.right]} allowDataOverflow>
          <Label value="ToF (usec)" position='bottom'/>
        </XAxis>
        <YAxis dataKey="y" type="number" domain={[state.bottom, state.top]} allowDataOverflow>
          <Label value="Intensity (AU)" angle={-90} position="left" style={{ textAnchor: 'middle' }}/>
        </YAxis>
        <Line type="monotone" dataKey="y" stroke="#ffffff" dot={false} activeDot={false} animationDuration={300} />
        {props.lineplotBboxData.map((entry) => (
          <ReferenceArea 
			onClick={() => selectReflection(entry.id)}
            key={entry.id}
            x1={entry.x1}
            x2={entry.x2}
	  		stroke={props.selectedReflectionId == entry.id? '#59b578' : 'rgba(255, 255, 255, 0.1)'}
	  		fill={props.selectedReflectionId == entry.id? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)'}
			strokeWidth={2}
			animationDuration={300}
          />
        ))}
        {props.lineplotCentroidData.map((entry, index) => (
          <ReferenceDot
            key={`annotation-${index}`}
            x={entry.x}
            y={entry.y}
	  		stroke={props.selectedReflectionId == entry.id? "#59b578" : 'white'}
	  		fill={props.selectedReflectionId == entry.id? "#59b578" : 'white'}
			label={validMillerIdx(entry.millerIdx)? {position:"top",  value: entry.millerIdx, fill: '#e74c3c', fontSize: 18 }: ""}
			r={3}
          />
        ))}

		        {state.refAreaLeft && state.refAreaRight ? (
          <ReferenceArea
            x1={state.refAreaLeft}
            x2={state.refAreaRight}
			fill={'rgba(255, 255, 255, 0.1)'}
	  		stroke={'rgba(255, 255, 255, 0.1)'}
			animationDuration={300}
          />
				) : null}
      </LineChart>
	  </div>
	  </ResponsiveContainer>
    </div>
  );
}