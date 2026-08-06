
  $(document).ready(function () {
    // Data (similar to your React version)
    const searchItems = [
      { title: 'Data Science Engineering', description: 'Data Science Engineering is a multidisciplinary field that combines computer science.', image: 'assets/images/search/seacrh1.png' },
      { title: 'Web Development', description: 'Web Development involves creating websites and apps using frontend and backend technologies.', image: 'assets/images/search/seacrh2.png' },
      { title: 'Best AI Tools 2025', description: 'Explore top-rated AI tools making waves in 2025.', image: 'assets/images/search/seacrh3.png' },
      { title: 'Popular Software Systems', description: 'Software systems widely used in enterprise environments.', image: 'assets/images/search/seacrh4.png' },
      { title: 'Top Machine Learning Courses', description: 'Curated list of machine learning programs for 2025.', image: 'assets/images/search/seacrh5.png' },
      { title: 'Data Analytics Course', description: 'Master data analytics with this industry-ready course.', image: 'assets/images/search/seacrh6.png' },
    ];

    const trendingKeywords = [
      'Analytics','User Management','Profile Settings','Billing Settings','Customer Support',
      'Sales Report','Data Science','Machine Learning','Artificial Intelligence','Web Development',
      'Python Programming','Dashboard App','Mobile'
    ];

    // Render trending keywords
    trendingKeywords.forEach(keyword => {
      $('#trendingKeywords').append(`
        <button class="keywords">
          <span><i class="bx bx-search fs-5"></i></span>
          <span>${keyword}</span>
        </button>
      `);
    });

    // Render initial popular items
    renderResults(searchItems);

    // Keyword click autofill
    $(document).on('click', '.keywords', function () {
      const text = $(this).text().trim();
      $('#searchInput').val(text).trigger('input');
    });

    // Live search
    $('#searchInput').on('input', function () {
      const query = $(this).val().toLowerCase().trim();
      const resultsTitle = $('#resultsTitle');
      const resultsContainer = $('#searchResults');

      if (query === '') {
        resultsTitle.text('Most Popular');
        renderResults(searchItems);
        $('.trending-search').show();
        return;
      }

      const filtered = searchItems.filter(item =>
        item.title.toLowerCase().includes(query)
      );

      resultsTitle.text('Search Results');
      $('.trending-search').hide();

      if (filtered.length > 0) {
        renderResults(filtered);
      } else {
        resultsContainer.html(`
          <div class="text-primary p-3 rounded-3 fs-5 bg-primary bg-opacity-10 border-start border-3 border-primary">
            No results found
          </div>
        `);
      }
    });

    // ✅ Auto-focus input when offcanvas opens
    const offcanvasEl = document.getElementById('offcanvasSearch');
    offcanvasEl.addEventListener('shown.bs.offcanvas', function () {
      $('#searchInput').trigger('focus');
    });

    // Helper function to render cards
    function renderResults(items) {
      const container = $('#searchResults');
      container.empty();
      items.forEach(item => {
        container.append(`
          <div class="col">
            <div class="list-search-item d-flex align-items-center gap-3 p-3 border rounded-3 h-100">
              <div class="list-search-img">
                <img src="${item.image}" class="rounded-3" width="100" alt="${item.title}">
              </div>
              <div>
                <h5 class="mb-0 list-search-item-title">${item.title}</h5>
                <p class="mb-0 list-search-item-desc text-truncate-2">${item.description}</p>
              </div>
            </div>
          </div>
        `);
      });
    }
  });
