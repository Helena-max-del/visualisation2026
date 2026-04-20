import ToolIntro from '../components/part3/ToolIntro.jsx'
import CitySelector from '../components/part3/CitySelector.jsx'
import SpeedSelector from '../components/part3/SpeedSelector.jsx'
import RapidToggle from '../components/part3/RapidToggle.jsx'
import NeighbourhoodMap from '../components/part3/NeighbourhoodMap.jsx'
import ResultPanel from '../components/part3/ResultPanel.jsx'
import ServiceAreaLegend from '../components/part3/ServiceAreaLegend.jsx'
import Part3Notes from '../components/part3/Part3Notes.jsx'

export default function Part3() {
  return (
    <>
      <ToolIntro />
      <div className="control-grid">
        <CitySelector />
        <SpeedSelector />
        <RapidToggle />
      </div>
      <div className="chart-grid">
        <NeighbourhoodMap />
        <ResultPanel />
      </div>
      <ServiceAreaLegend />
      <Part3Notes />
    </>
  )
}
