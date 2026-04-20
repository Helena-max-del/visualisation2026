import Layout from './components/common/Layout.jsx'
import OverviewClean from './pages/OverviewClean.jsx'
import Part1Real from './pages/Part1Real.jsx'
import Part2 from './pages/Part2.jsx'
import Part3 from './pages/Part3.jsx'
import AboutMethodology from './pages/AboutMethodology.jsx'

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <OverviewClean /> },
      { path: 'part1', element: <Part1Real /> },
      { path: 'part2', element: <Part2 /> },
      { path: 'part3', element: <Part3 /> },
      { path: 'about', element: <AboutMethodology /> },
    ],
  },
]
