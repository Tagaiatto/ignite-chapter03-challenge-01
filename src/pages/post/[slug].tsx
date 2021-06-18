import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const contentWordsAmount = post.data.content.reduce((total, item) => {
    const headingWordsAmount = item.heading.split(/\s+/).length;

    const bodyWordsAmountArray = item.body.map(t => t.text.split(/\s+/).length);
    const bodyWordsAmount = bodyWordsAmountArray.reduce(
      (acc, curr) => acc + curr
    );
    return total + headingWordsAmount + bodyWordsAmount;
  }, 0);

  const wordsReadAvg = 200;
  const readingTime = Math.ceil(contentWordsAmount / wordsReadAvg);

  return (
    <>
      <Header />
      {router.isFallback ? (
        <div> Carregando... </div>
      ) : (
        <>
          <figure>
            <img src={post.data.banner.url} alt="banner" />
          </figure>
          <main>
            <title>{post.data.title}</title>
            <div>
              {post.first_publication_date}
              {post.data.author}
              {readingTime}
            </div>

            {post.data.content.map(content => (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            ))}
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'd MMM y',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.main.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  // console.log(post);
  // console.log(post.data.content);
  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
