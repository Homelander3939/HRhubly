import { createFileRoute } from '@tanstack/react-router'
import AgileProcessDiagramPage from '../../AgileProcessDiagramPage'

export const Route = createFileRoute('/agile-process-map')({
  component: AgileProcessDiagramPage,
})
