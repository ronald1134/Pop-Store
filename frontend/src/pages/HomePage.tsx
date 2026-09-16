import { Box, Button, Flex, Grid, Heading, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, ArrowRight, Sparkles, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useProducts } from '../context/ProductContext'

const categories = [
  { label: 'Mangás', accent: 'pink.400', value: 'Mangá' },
  { label: 'Livros', accent: 'purple.400', value: 'Livro' },
  { label: 'HQs', accent: 'cyan.400', value: 'HQ' },
  { label: 'Kindle', accent: 'teal.400', value: 'Kindle' },
  { label: 'Acessórios', accent: 'orange.400', value: 'Acessório' },
]

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=85',
    eyebrow: 'Leituras que ficam',
    title: 'Sua próxima obsessão começa aqui.',
  },
  {
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1200&q=85',
    eyebrow: 'Universos para colecionar',
    title: 'Encontre histórias do seu jeito.',
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85',
    eyebrow: 'Cultura pop em destaque',
    title: 'Clássicos, novidades e muita personalidade.',
  },
]

const PageSection = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 1.5rem;

  @media (max-width: 768px) {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }
`

const HeroSection = styled(PageSection)`
  padding-top: 5rem;
  padding-bottom: 5rem;
`

const HeroLayout = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  gap: 2rem;

  @media (max-width: 992px) {
    flex-direction: column;
  }
`

const HeroCopy = styled(Box)`
  flex: 1;
`

const HeroActions = styled(Flex)`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`

const HeroCarousel = styled(Box)`
  position: relative;
  flex: 1;
  width: 100%;
  max-width: 560px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
`

const Slide = styled(Box)<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  transition: opacity 0.7s ease-in-out;
`

const SlideImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const SlideOverlay = styled(Box)`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent 65%);
`

const SlideContent = styled(Box)`
  position: absolute;
  right: 1.25rem;
  bottom: 2rem;
  left: 2rem;

  @media (max-width: 768px) {
    bottom: 1.5rem;
    left: 1.25rem;
  }
`

const CarouselControls = styled(Flex)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  left: 1rem;
  justify-content: space-between;
`

const CarouselButton = styled(Button)`
  min-width: 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 999px;
  color: white;
  background: rgba(0, 0, 0, 0.6);

  &:hover {
    background: #ec4899;
  }
`

const CarouselIndicators = styled(Flex)`
  position: absolute;
  right: 1.25rem;
  bottom: 1rem;
  gap: 0.5rem;
`

const CarouselIndicator = styled(Box)<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '26px' : '8px')};
  height: 8px;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#f9a8d4' : 'rgba(255, 255, 255, 0.7)')};
  cursor: pointer;
  transition: all 0.25s ease;
`

const SectionBand = styled(Box)`
  background: #1f2937;
`

const SectionHeading = styled(Heading)`
  margin-bottom: 2rem;
`

const CategoryGrid = styled(SimpleGrid)`
  animation: floatUp 700ms ease-out both;
`

const CategoryCard = styled(Box)`
  padding: 1.5rem;
  text-align: center;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f9a8d4;
    transform: translateY(-2px);
  }
`

const CategoryIcon = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.75rem;
  border-radius: 999px;
`

const ProductsHeader = styled(Flex)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`

const ProductGrid = styled(Grid)`
  gap: 1.5rem;
`

const ProductCard = styled(Box)`
  overflow: hidden;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f9a8d4;
    transform: translateY(-4px);
  }
`

const ProductImage = styled(Image)`
  width: 100%;
  height: 280px;
  padding: 0.75rem;
  object-fit: contain;
  background: #111827;
`

const ProductContent = styled(Box)`
  padding: 1.25rem;
`

export function HomePage() {
  const { products, loading } = useProducts()
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const showPreviousSlide = () => {
    setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)
  }

  const showNextSlide = () => {
    setActiveSlide((current) => (current + 1) % heroSlides.length)
  }

  const popularProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  const handleCategoryClick = (category: string) => {
    navigate('/produtos', { state: { category } })
  }

  return (
    <Box>
      <HeroSection>
        <HeroLayout>
          <HeroCopy className="reveal">
            <Stack spacing={5}>
              <Text color="pink.300" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">
                Loja oficial de cultura pop
              </Text>
              <Heading as="h1" size="2xl" lineHeight="1.1">
                Descubra mangás, livros, HQs, Kindle e acessórios geek.
              </Heading>
              <Text color="gray.300" fontSize="lg">
                Uma experiência completa para quem ama colecionar, ler e se vestir com estilo.
              </Text>
              <HeroActions>
                <Button as={Link} to="/produtos" colorScheme="pink" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Ver produtos
                </Button>
                <Button
                  as={Link}
                  to="/checkout"
                  variant="outline"
                  colorScheme="pink"
                  size="lg"
                  bg="rgba(244, 114, 182, 0.08)"
                  borderColor="pink.300"
                  color="pink.100"
                  _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
                  _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
                >
                  Meu carrinho
                </Button>
              </HeroActions>
            </Stack>
          </HeroCopy>

          <HeroCarousel
            className="reveal"
            role="region"
            aria-label="Destaques da loja"
            aria-roledescription="carrossel"
          >
            {heroSlides.map((slide, index) => (
              <Slide
                key={slide.image}
                $active={index === activeSlide}
              >
                <SlideImage
                  src={slide.image}
                  alt={slide.title}
                />
                <SlideOverlay />
                <SlideContent>
                  <Text color="pink.200" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                    {slide.eyebrow}
                  </Text>
                  <Heading as="h2" size={{ base: 'md', md: 'lg' }} mt={2} maxW="400px">
                    {slide.title}
                  </Heading>
                </SlideContent>
              </Slide>
            ))}

            <CarouselControls>
              <CarouselButton
                aria-label="Imagem anterior"
                title="Imagem anterior"
                onClick={showPreviousSlide}
              >
                <ArrowLeft size={17} />
              </CarouselButton>
              <CarouselButton
                aria-label="Próxima imagem"
                title="Próxima imagem"
                onClick={showNextSlide}
              >
                <ArrowRight size={17} />
              </CarouselButton>
            </CarouselControls>

            <CarouselIndicators>
              {heroSlides.map((slide, index) => (
                <CarouselIndicator
                  key={slide.title}
                  as="button"
                  type="button"
                  aria-label={`Ir para imagem ${index + 1}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                  onClick={() => setActiveSlide(index)}
                  $active={index === activeSlide}
                />
              ))}
            </CarouselIndicators>
          </HeroCarousel>
        </HeroLayout>
      </HeroSection>

      <SectionBand>
        <PageSection>
          <SectionHeading as="h2" size="lg" className="reveal">
            Categorias em destaque
          </SectionHeading>

          <CategoryGrid columns={{ base: 1, md: 3, lg: 5 }}>
            {categories.map((item) => (
              <CategoryCard
                key={item.label}
                as="button"
                type="button"
                className="reveal"
                onClick={() => handleCategoryClick(item.value)}
                aria-label={`Ir para a categoria ${item.label}`}
              >
                <CategoryIcon bg={item.accent}>
                  <Sparkles size={18} color="white" />
                </CategoryIcon>
                <Text fontWeight="bold">{item.label}</Text>
              </CategoryCard>
            ))}
          </CategoryGrid>
        </PageSection>
      </SectionBand>

      <PageSection>
        <ProductsHeader className="reveal">
          <Heading as="h2" size="lg">
            Produtos populares
          </Heading>
          <Button as={Link} to="/produtos" variant="ghost" colorScheme="pink">
            Ver catálogo completo
          </Button>
        </ProductsHeader>

        {loading ? (
          <Text color="gray.300">Carregando produtos...</Text>
        ) : (
          <ProductGrid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}>
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                className="reveal"
              >
                <ProductImage
                  src={product.image}
                  alt={product.title}
                />
                <ProductContent>
                  <Text color="pink.300" fontSize="sm" fontWeight="bold">
                    {product.category}
                  </Text>
                  <Heading as="h3" size="md" mt={2}>
                    {product.title}
                  </Heading>
                  <Text mt={2} color="gray.300">
                    {product.description}
                  </Text>
                  <Flex align="center" justify="space-between" mt={4}>
                    <Text fontWeight="bold" fontSize="xl">
                      R$ {product.price.toFixed(2)}
                    </Text>
                    <Text color="yellow.300" display="flex" alignItems="center" gap={1}>
                      <Star size={16} fill="currentColor" />
                      {product.rating.toFixed(1)}
                    </Text>
                  </Flex>
                </ProductContent>
              </ProductCard>
            ))}
          </ProductGrid>
        )}
      </PageSection>
    </Box>
  )
}
