import { Avatar, Box, Card, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const StatCard = ({ title, value, icon, percentage, isPositive }) => {
    const variationColor = isPositive ? 'success.main' : 'error.main';
    const iconColor = icon.props.sx.color || 'primary.main';
    const iconColorName = iconColor.split('.')[0];
    const avatarBgColor = `${iconColorName}.light`;

    return (
        <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 3, 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            height: '100%',
            '&:hover .MuiAvatar-root': {
                transform: 'scale(1.1)',
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ 
                    bgcolor: avatarBgColor, 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    transition: 'transform 0.3s ease-in-out',
                }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: variationColor }}>
                {isPositive ? <ArrowUpwardIcon sx={{ fontSize: '1rem' }} /> : <ArrowDownwardIcon sx={{ fontSize: '1rem' }} />}
                <Typography variant="caption" sx={{ fontWeight: 'bold', mx: 0.5 }}>
                    {percentage}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    vs mês anterior
                </Typography>
            </Box>
        </Card>
    );
};

export default StatCard;