import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  return (
    <>
      <div className={styles.container}>
        <img src="/images/logo.png" alt="logo" className={styles.logo} />
        <div className={styles.posts}>
          {results.map(post => (
            <Link href={`/post/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>{post.first_publication_date}</time>
                  {post.data.author}
                </div>
              </a>
            </Link>
          ))}
          {next_page ? <button type="button">Carregar mais posts</button> : ''}
          <button type="button">Carregar mais posts</button>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    }
  );

  const { next_page } = postsResponse;

  const results: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM y',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: String(post.data.title),
        subtitle: String(post.data.subtitle),
        author: String(post.data.author),
      },
    };
  });

  return {
    props: {
      postsPagination: { results, next_page },
    },
  };
};
