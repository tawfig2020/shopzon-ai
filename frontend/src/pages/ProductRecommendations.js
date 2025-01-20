import React from 'react';

import { Container, Grid, Card, CardContent, CardMedia, Typography, Button } from '@mui/material';

const ProductRecommendations = () => {
  // Mock data - replace with actual API calls
  const recommendations = [
    {
      id: 1,
      title: 'Product 1',
      description: 'Description for product 1',
      image: 'https://via.placeholder.com/150',
      price: '$99.99',
    },
    {
      id: 2,
      title: 'Product 2',
      description: 'Description for product 2',
      image: 'https://via.placeholder.com/150',
      price: '$149.99',
    },
  ];

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Typography variant='h4' gutterBottom>
        Recommended Products
      </Typography>
      <Grid container spacing={3}>
        {recommendations.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia component='img' height='140' image={product.image} alt={product.title} />
              <CardContent>
                <Typography gutterBottom variant='h5' component='div'>
                  {product.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {product.description}
                </Typography>
                <Typography variant='h6' sx={{ mt: 2 }}>
                  {product.price}
                </Typography>
                <Button variant='contained' sx={{ mt: 2 }}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductRecommendations;
