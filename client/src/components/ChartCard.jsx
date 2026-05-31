import { Box, Card, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ChartCard = ({ title, children, showFilters = true, year, onYearChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2022 }, (_, i) => currentYear - i);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2, height: '100%', width: '100%' }}>
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            flexDirection: { xs: 'column', sm: 'row' }, 
            mb: 2 
        }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            {showFilters && (
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, mt: { xs: 2, sm: 0 } }}>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Período</InputLabel>
                        <Select label="Período" defaultValue="Mensal">
                            <MenuItem value="Mensal">Mensal</MenuItem>
                            <MenuItem value="Anual">Anual</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Ano</InputLabel>
                        <Select label="Ano" value={year} onChange={(e) => onYearChange(e.target.value)}>
                            {years.map((y) => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}
        </Box>
        <Box sx={{ height: 310 }}>
            {children}
        </Box>
    </Card>
  );
};

export default ChartCard;