import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
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

  const formattedResults = results.map(post => ({
    first_publication_date: format(
      new Date(post.first_publication_date),
      'd MMM y',
      {
        locale: ptBR,
      }
    ),
    ...post,
  }));
  const [posts, setPosts] = useState<Post[]>(formattedResults);
  const [nextPage, setNextPage] = useState(next_page);
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function handleLoadPosts() {
    const postResults = await fetch(`${nextPage}`).then(res => res.json());

    setNextPage(postResults.next_page);

    const newPosts = postResults.results.map(post => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM YYY',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <div className={`${styles.container} ${commonStyles.container}`}>
        <div className={styles.logo}>
          <img src="/images/logo.png" alt="logo" />
        </div>
        <div className={`${styles.posts} ${commonStyles.postContainer}`}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.icons}>
                  <p>
                    <FiCalendar />
                    {format(new Date(post.first_publication_date), 'd MMM y', {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    <FiUser />
                    {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {next_page ? (
            <button type="button" onClick={handleLoadPosts}>
              Carregar mais posts
            </button>
          ) : (
            ''
          )}
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
      first_publication_date: post.first_publication_date,
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
