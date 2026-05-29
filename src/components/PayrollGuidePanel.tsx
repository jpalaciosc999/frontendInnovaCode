import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePayrollGuide } from '../context/PayrollGuideContext';

export default function PayrollGuidePanel() {
  const {
    active,
    steps,
    completedPaths,
    currentStep,
    currentIndex,
    nextStep,
    stopGuide,
    goToStep,
    goToNextStep,
  } = usePayrollGuide();

  if (!active || !currentStep || steps.length === 0) return null;

  const progress = Math.round((completedPaths.length / steps.length) * 100);
  const isLastStep = !nextStep;

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: 2,
        borderColor: 'primary.light',
        bgcolor: 'rgba(37, 99, 235, 0.045)',
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <PlaylistAddCheckIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Flujo guiado
                </Typography>
                <Chip size="small" color="primary" label={`Paso ${currentIndex + 1} de ${steps.length}`} />
                <Chip size="small" icon={<CheckCircleIcon />} label={`${progress}% completado`} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {currentStep.title}: {currentStep.helper}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
            <Button
              variant="contained"
              endIcon={isLastStep ? undefined : <ArrowForwardIcon />}
              onClick={() => goToNextStep()}
            >
              {isLastStep ? 'Finalizar guia' : nextStep?.title}
            </Button>
            <Button color="inherit" startIcon={<CloseIcon />} onClick={stopGuide}>
              Cerrar
            </Button>
          </Stack>
        </Stack>

        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 1 }} />

        <Stepper
          nonLinear
          activeStep={currentIndex}
          sx={{ overflowX: 'auto', pb: 0.5 }}
        >
          {steps.map((step) => (
            <Step key={step.path} completed={completedPaths.includes(step.path)}>
              <StepButton onClick={() => goToStep(step.path)}>
                <StepLabel optional={step.optional ? <Typography variant="caption">Opcional</Typography> : undefined}>
                  {step.title}
                </StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Stack>
    </Paper>
  );
}
